import { db } from "../db/index.js";
import { knowledgeDocuments, knowledgeChunks } from "../db/schema/knowledge.js";
import { PORTFOLIO_KNOWLEDGE } from "../services/portfolio-knowledge.js";
import { EmbeddingService } from "../services/embedding.service.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function fetchReadme(repoUrl: string): Promise<string | null> {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;

  const owner = match[1];
  const repo = match[2];

  const branches = ["main", "master"];
  for (const branch of branches) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
    try {
      const response = await fetch(rawUrl);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      // ignore and try next branch
    }
  }
  return null;
}

function md5(content: string) {
  return crypto.createHash("md5").update(content).digest("hex");
}

async function ingest() {
  console.log("Starting RAG ingestion for Portfolio Projects...");

  for (const project of PORTFOLIO_KNOWLEDGE.projects) {
    console.log(`\nProcessing: ${project.title}`);
    
    if (!project.url.includes("github.com")) {
      console.log(`Skipping ${project.title}: Not a GitHub URL`);
      continue;
    }

    const readmeContent = await fetchReadme(project.url);
    if (!readmeContent) {
      console.log(`Failed to fetch README for ${project.title}`);
      continue;
    }

    const checksum = md5(readmeContent);

    // Check if we already have this exact document
    const existing = await db.query.knowledgeDocuments.findFirst({
      where: eq(knowledgeDocuments.sourceUri, project.url),
    });

    if (existing && existing.checksum === checksum) {
      console.log(`No changes detected for ${project.title}, skipping.`);
      continue;
    }

    // Delete existing old version if any
    if (existing) {
      console.log(`Updating ${project.title} (checksum changed). Removing old chunks...`);
      await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, existing.id));
    }

    // 1. Insert Document
    const [doc] = await db.insert(knowledgeDocuments).values({
      title: `${project.title} README`,
      sourceType: "GITHUB_README",
      sourceUri: project.url,
      visibility: "PUBLIC",
      mimeType: "text/markdown",
      checksum: checksum,
      status: "COMPLETED",
    }).returning();

    if (!doc) {
      console.error(`Failed to insert document for ${project.title}`);
      continue;
    }

    // 2. Chunk and Embed
    console.log(`Chunking README...`);
    const chunks = EmbeddingService.chunkText(readmeContent);
    console.log(`Generated ${chunks.length} chunks. Fetching embeddings...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      if (!chunkText) continue;

      try {
        const embedding = await EmbeddingService.generateEmbedding(chunkText);

        await db.insert(knowledgeChunks).values({
          documentId: doc.id,
          chunkIndex: i,
          content: chunkText,
          embedding: embedding,
          tokenCount: chunkText.length / 4, // Rough approximation
        });
      } catch (err: any) {
        console.error(`Failed to embed chunk ${i} for ${project.title}:`, err.message);
      }
    }
    
    console.log(`Successfully ingested ${project.title}!`);
  }

  console.log("\nIngestion pipeline complete.");
  process.exit(0);
}

ingest().catch(console.error);
