import { db } from "../db/index.js";
import { knowledgeDocuments, knowledgeChunks } from "../db/schema/knowledge.js";
import { EmbeddingService } from "./embedding.service.js";
import { eq, sql } from "drizzle-orm";

export type RetrievalResult = {
  documentId: string;
  title: string;
  sourceType: string;
  content: string;
  sourceUri: string | null;
  metadata: unknown;
  chunkIndex: number | null;
  similarity: number;
};

export class RagInfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RagInfrastructureError";
  }
}

export class RagService {
  /**
   * Retrieves the most relevant knowledge chunks for a given query.
   */
  static async retrieve(query: string, limit = 3): Promise<RetrievalResult[]> {
    try {
      // 1. Convert query to vector
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);

      if (queryEmbedding.length !== 768) {
        throw new RagInfrastructureError("RAG embedding dimension is not 768.");
      }

      // Convert array to string for pgvector '[1,2,3...]'
      const embeddingString = `[${queryEmbedding.join(",")}]`;

      // 2. Perform similarity search using cosine distance (<=>)
      // We only want PUBLIC documents.
      const results = await db
        .select({
          documentId: knowledgeChunks.documentId,
          title: knowledgeDocuments.title,
          sourceType: knowledgeDocuments.sourceType,
          content: knowledgeChunks.content,
          sourceUri: knowledgeDocuments.sourceUri,
          metadata: knowledgeDocuments.metadata,
          chunkIndex: knowledgeChunks.chunkIndex,
          similarity: sql<number>`1 - (${knowledgeChunks.embedding} <=> ${embeddingString})`,
        })
        .from(knowledgeChunks)
        .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
        .where(
          sql`${knowledgeDocuments.visibility} = 'PUBLIC' AND ${knowledgeDocuments.status} IN ('READY', 'COMPLETED') AND ${knowledgeChunks.embedding} IS NOT NULL`,
        )
        .orderBy(sql`${knowledgeChunks.embedding} <=> ${embeddingString}`)
        .limit(Math.max(1, Math.min(limit, 10)));

      // 3. Filter out low confidence results (optional threshold)
      const confidenceThreshold = 0.5;
      return results.filter((res) => res.similarity > confidenceThreshold);
      
    } catch (error) {
      console.error(
        "[RagService] Retrieval unavailable:",
        error instanceof Error ? error.name : "unknown error",
      );
      if (error instanceof RagInfrastructureError) {
        throw error;
      }
      throw new RagInfrastructureError("RAG retrieval is unavailable.");
    }
  }
}
