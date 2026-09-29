import { db } from "../db/index.js";
import { knowledgeDocuments, knowledgeChunks } from "../db/schema/knowledge.js";
import { EmbeddingService } from "./embedding.service.js";
import { eq, sql } from "drizzle-orm";

export type RetrievalResult = {
  content: string;
  sourceUri: string | null;
  similarity: number;
};

export class RagService {
  /**
   * Retrieves the most relevant knowledge chunks for a given query.
   */
  static async retrieve(query: string, limit = 3): Promise<RetrievalResult[]> {
    try {
      // 1. Convert query to vector
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);

      // Convert array to string for pgvector '[1,2,3...]'
      const embeddingString = `[${queryEmbedding.join(",")}]`;

      // 2. Perform similarity search using cosine distance (<=>)
      // We only want PUBLIC documents.
      const results = await db
        .select({
          content: knowledgeChunks.content,
          sourceUri: knowledgeDocuments.sourceUri,
          similarity: sql<number>`1 - (${knowledgeChunks.embedding} <=> ${embeddingString})`,
        })
        .from(knowledgeChunks)
        .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
        .where(eq(knowledgeDocuments.visibility, "PUBLIC"))
        .orderBy(sql`${knowledgeChunks.embedding} <=> ${embeddingString}`)
        .limit(limit);

      // 3. Filter out low confidence results (optional threshold)
      const confidenceThreshold = 0.5;
      return results.filter((res) => res.similarity > confidenceThreshold);
      
    } catch (error) {
      console.error("[RagService] Error retrieving context:", error);
      return [];
    }
  }
}
