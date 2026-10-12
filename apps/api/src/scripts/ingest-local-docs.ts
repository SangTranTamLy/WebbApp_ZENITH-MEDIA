import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ingestKnowledgeDocument,
  parseLocalDocument,
  UnsupportedDocumentFormatError,
  UnsafeDocumentError,
  getFileExtension,
} from "../services/knowledge-ingestion.service.js";
import { type KnowledgeVisibility } from "../services/rag-policy.js";

const CANDIDATE_EXTENSIONS = new Set([".docx", ".md", ".txt", ".pdf", ".xlsx", ".xls"]);

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function printUsage(): void {
  console.error(
    "Usage: pnpm --filter @zenith/api ingest:local -- --root <path> --visibility PUBLIC|PRIVATE --confirm",
  );
  console.error("The root is intentionally explicit; this command never scans docs/knowledge or reports by default.");
}

async function findCandidateFiles(rootPath: string): Promise<string[]> {
  const stat = await fs.stat(rootPath);
  if (stat.isFile()) return [rootPath];

  const files: string[] = [];
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("~")) continue;
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findCandidateFiles(entryPath)));
    } else if (CANDIDATE_EXTENSIONS.has(getFileExtension(entryPath))) {
      files.push(entryPath);
    }
  }
  return files;
}

async function main(): Promise<void> {
  const rootOption = readOption("--root") ?? process.env.KNOWLEDGE_INGEST_ROOT;
  const visibility = (readOption("--visibility") ?? process.env.KNOWLEDGE_INGEST_VISIBILITY) as
    | KnowledgeVisibility
    | undefined;
  const confirmed = process.argv.includes("--confirm") || process.env.KNOWLEDGE_INGEST_CONFIRM === "YES";

  if (!rootOption || !visibility || !["PUBLIC", "PRIVATE"].includes(visibility) || !confirmed) {
    printUsage();
    process.exitCode = 2;
    return;
  }

  const rootPath = path.resolve(rootOption);
  try {
    await fs.access(rootPath);
  } catch {
    console.error(`BLOCKED: ingest root does not exist: ${rootPath}`);
    process.exitCode = 2;
    return;
  }

  const files = await findCandidateFiles(rootPath);
  if (files.length === 0) {
    console.log("No supported or explicitly blocked document files were found.");
    return;
  }

  let ingested = 0;
  let skipped = 0;
  let blocked = 0;
  let errors = 0;
  for (const filePath of files) {
    const relativePath = path.relative(rootPath, filePath).replace(/\\/g, "/") || path.basename(filePath);
    const sourceUri = pathToFileURL(filePath).toString();
    try {
      const parsed = await parseLocalDocument(filePath);
      const result = await ingestKnowledgeDocument({
        title: relativePath,
        sourceType: "FILE",
        sourceUri,
        mimeType: parsed.mimeType,
        visibility,
        text: parsed.text,
        metadata: {
          parser: parsed.parser,
          sourcePath: relativePath,
          approval: "explicit-cli-confirmation",
        },
      });

      if (result.status === "SKIPPED") skipped++;
      else ingested++;
      console.log(`${result.status}: ${relativePath} (${result.chunks} chunks)`);
    } catch (error) {
      if (error instanceof UnsupportedDocumentFormatError || error instanceof UnsafeDocumentError) {
        blocked++;
        console.error(`BLOCKED: ${relativePath} — ${error.message}`);
        continue;
      }
      errors++;
      console.error(`ERROR: ${relativePath} — ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  console.log(`Ingestion summary: ingested=${ingested}, skipped=${skipped}, blocked=${blocked}, errors=${errors}`);
  if (errors > 0) process.exitCode = 1;
  else if (blocked > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`Ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
