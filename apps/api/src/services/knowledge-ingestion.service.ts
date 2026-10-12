import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { knowledgeChunks, knowledgeDocuments } from "../db/schema/knowledge.js";
import { EmbeddingService } from "./embedding.service.js";
import {
  KNOWLEDGE_READY_STATUSES,
  type KnowledgeVisibility,
} from "./rag-policy.js";

export type KnowledgeSourceType = "FILE" | "URL";

export type ParsedDocument = {
  text: string;
  mimeType: string;
  parser: "plain-text" | "mammoth-docx";
};

export type IngestionInput = {
  title: string;
  sourceType: KnowledgeSourceType;
  sourceUri: string;
  mimeType: string;
  visibility: KnowledgeVisibility;
  text: string;
  metadata?: Record<string, unknown>;
  chunkSize?: number;
  chunkOverlap?: number;
};

export type IngestionResult = {
  status: "INGESTED" | "SKIPPED";
  documentId: string;
  checksum: string;
  chunks: number;
};

export class UnsupportedDocumentFormatError extends Error {
  constructor(extension: string) {
    super(
      `Unsupported document format: ${extension}. Supported formats are .docx, .md and .txt. PDF/XLSX ingestion is BLOCKED until a reviewed parser dependency is added.`,
    );
    this.name = "UnsupportedDocumentFormatError";
  }
}

export class UnsafeDocumentError extends Error {
  constructor() {
    super("Document contains a secret-like value or is a protected secret file; ingestion was blocked.");
    this.name = "UnsafeDocumentError";
  }
}

export class IngestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionError";
  }
}

export function normalizeDocumentText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sha256Text(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function chunkTextWithOverlap(
  text: string,
  maxCharacters = 1600,
  overlapCharacters = 200,
): string[] {
  if (!Number.isInteger(maxCharacters) || maxCharacters <= 0) {
    throw new RangeError("maxCharacters must be a positive integer.");
  }
  if (
    !Number.isInteger(overlapCharacters) ||
    overlapCharacters < 0 ||
    overlapCharacters >= maxCharacters
  ) {
    throw new RangeError("overlapCharacters must be between 0 and maxCharacters - 1.");
  }

  const normalized = normalizeDocumentText(text);
  if (!normalized) return [];

  const step = maxCharacters - overlapCharacters;
  const chunks: string[] = [];
  for (let start = 0; start < normalized.length; start += step) {
    const chunk = normalized.slice(start, start + maxCharacters).trim();
    if (chunk) chunks.push(chunk);
    if (start + maxCharacters >= normalized.length) break;
  }
  return chunks;
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLocaleLowerCase("en-US");
}

export function assertSafeDocument(filePathOrName: string, text: string): void {
  const basename = path.basename(filePathOrName);
  const protectedFilename =
    /^\.env(?:\.|$)/i.test(basename) ||
    /(secret|credential|password|private[-_ ]?key|access[-_ ]?token)/i.test(basename);

  const secretPatterns = [
    /-----BEGIN [^-]*PRIVATE KEY-----/i,
    /\bghp_[A-Za-z0-9]{20,}\b/i,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/i,
    /\bsk-[A-Za-z0-9]{20,}\b/i,
    /\bxox[bp]-[A-Za-z0-9-]{20,}\b/i,
    /\bAIza[A-Za-z0-9_-]{30,}\b/i,
    /\bAKIA[0-9A-Z]{16}\b/i,
    /\b(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*\S+/i,
  ];

  if (protectedFilename || secretPatterns.some((pattern) => pattern.test(text))) {
    throw new UnsafeDocumentError();
  }
}

export async function parseLocalDocument(filePath: string): Promise<ParsedDocument> {
  const extension = getFileExtension(filePath);
  assertSafeDocument(filePath, "");

  if (extension === ".md") {
    return {
      text: await fs.readFile(filePath, "utf8"),
      mimeType: "text/markdown",
      parser: "plain-text",
    };
  }

  if (extension === ".txt") {
    return {
      text: await fs.readFile(filePath, "utf8"),
      mimeType: "text/plain",
      parser: "plain-text",
    };
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
      text: result.value,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      parser: "mammoth-docx",
    };
  }

  throw new UnsupportedDocumentFormatError(extension || "(no extension)");
}

export async function ingestKnowledgeDocument(input: IngestionInput): Promise<IngestionResult> {
  const normalizedText = normalizeDocumentText(input.text);
  if (!normalizedText) throw new IngestionError("Document has no readable text.");

  assertSafeDocument(input.sourceUri, normalizedText);

  const checksum = sha256Text(normalizedText);
  const existing = await db.query.knowledgeDocuments.findFirst({
    where: eq(knowledgeDocuments.sourceUri, input.sourceUri),
  });
  const isReady = existing && KNOWLEDGE_READY_STATUSES.includes(
    existing.status as (typeof KNOWLEDGE_READY_STATUSES)[number],
  );

  if (
    existing &&
    existing.checksum === checksum &&
    existing.sourceType === input.sourceType &&
    existing.visibility === input.visibility &&
    isReady
  ) {
    const chunkCount = await db.query.knowledgeChunks.findMany({
      where: eq(knowledgeChunks.documentId, existing.id),
      columns: { id: true },
    });
    return {
      status: "SKIPPED",
      documentId: existing.id,
      checksum,
      chunks: chunkCount.length,
    };
  }

  const chunks = chunkTextWithOverlap(
    normalizedText,
    input.chunkSize ?? 1600,
    input.chunkOverlap ?? 200,
  );
  if (chunks.length === 0) throw new IngestionError("Document produced no chunks.");

  const embeddings: number[][] = [];
  try {
    for (const chunk of chunks) {
      embeddings.push(await EmbeddingService.generateEmbedding(chunk));
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "EmbeddingError";
    const metadata = {
      ...(input.metadata ?? {}),
      ingestionVersion: "sprint4-v1",
      error: errorName,
    };

    if (existing) {
      await db
        .update(knowledgeDocuments)
        .set({
          checksum,
          status: "ERROR",
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeDocuments.id, existing.id));
    } else {
      await db.insert(knowledgeDocuments).values({
        title: input.title,
        sourceType: input.sourceType,
        sourceUri: input.sourceUri,
        visibility: input.visibility,
        mimeType: input.mimeType,
        checksum,
        status: "ERROR",
        metadata,
      });
    }

    throw new IngestionError(`Embedding failed; document marked ERROR (${errorName}).`);
  }

  const metadata = {
    ...(input.metadata ?? {}),
    ingestionVersion: "sprint4-v1",
    chunkSize: input.chunkSize ?? 1600,
    chunkOverlap: input.chunkOverlap ?? 200,
  };

  return db.transaction(async (tx) => {
    let documentId = existing?.id;
    if (documentId) {
      await tx
        .update(knowledgeDocuments)
        .set({
          title: input.title,
          sourceType: input.sourceType,
          sourceUri: input.sourceUri,
          visibility: input.visibility,
          mimeType: input.mimeType,
          checksum,
          status: "PROCESSING",
          metadata,
          updatedAt: new Date(),
        })
        .where(eq(knowledgeDocuments.id, documentId));
    } else {
      const [inserted] = await tx
        .insert(knowledgeDocuments)
        .values({
          title: input.title,
          sourceType: input.sourceType,
          sourceUri: input.sourceUri,
          visibility: input.visibility,
          mimeType: input.mimeType,
          checksum,
          status: "PROCESSING",
          metadata,
        })
        .returning({ id: knowledgeDocuments.id });
      if (!inserted) throw new IngestionError("Document insert returned no id.");
      documentId = inserted.id;
    }

    await tx.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
    await tx.insert(knowledgeChunks).values(
      chunks.map((content, index) => ({
        documentId,
        chunkIndex: index,
        content,
        embedding: embeddings[index] ?? [],
        tokenCount: Math.ceil(content.length / 4),
        metadata: {
          sourceUri: input.sourceUri,
          sourceType: input.sourceType,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      })),
    );
    await tx
      .update(knowledgeDocuments)
      .set({ status: "READY", updatedAt: new Date() })
      .where(eq(knowledgeDocuments.id, documentId));

    return {
      status: "INGESTED",
      documentId,
      checksum,
      chunks: chunks.length,
    };
  });
}
