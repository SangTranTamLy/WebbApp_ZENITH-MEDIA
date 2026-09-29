import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from './src/db/index.js';
import { knowledgeDocuments, knowledgeChunks } from './src/db/schema/knowledge.js';
import { EmbeddingService } from './src/services/embedding.service.js';
import { eq } from 'drizzle-orm';

async function ingestWhitepaper() {
  const mdPath = path.resolve(process.cwd(), '../../docs/mda-assistant-whitepaper.md');
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  
  console.log("Ingesting Whitepaper...");
  
  const checksum = crypto.createHash('md5').update(mdContent).digest('hex');
  const uri = "local://docs/mda-assistant-whitepaper.md";
  
  const existing = await db.query.knowledgeDocuments.findFirst({
    where: eq(knowledgeDocuments.sourceUri, uri),
  });
  
  if (existing && existing.checksum === checksum) {
    console.log("No changes detected, skipping.");
    process.exit(0);
  }
  
  if (existing) {
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, existing.id));
  }
  
  const [doc] = await db.insert(knowledgeDocuments).values({
    title: "MDA Assistant Whitepaper",
    sourceType: "LOCAL_MD",
    sourceUri: uri,
    visibility: "PUBLIC",
    mimeType: "text/markdown",
    checksum,
    status: "COMPLETED",
  }).returning();
  
  const chunks = EmbeddingService.chunkText(mdContent, 1000);
  console.log(`Generated ${chunks.length} chunks. Fetching embeddings...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    try {
      const embedding = await EmbeddingService.generateEmbedding(chunkText);
      await db.insert(knowledgeChunks).values({
        documentId: doc.id,
        chunkIndex: i,
        content: chunkText,
        embedding: embedding,
        tokenCount: chunkText.length / 4,
      });
    } catch (err) {
      console.error(`Failed to embed chunk ${i}:`, err.message);
    }
  }
  
  console.log("Whitepaper ingested successfully!");
  process.exit(0);
}

ingestWhitepaper().catch(console.error);
