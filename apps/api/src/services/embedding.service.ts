import dotenv from "dotenv";
import { getModelRuntimeConfig } from "./model-config.js";
dotenv.config();

const EMBEDDING_DIMENSION = 768;

/**
 * Service to generate vector embeddings for RAG.
 */
export class EmbeddingService {
  /**
   * Generates embeddings using a local Ollama instance or compatible API.
   * Based on the project plan, we are using `nomic-embed-text` which has 768 dimensions.
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const runtimeConfig = getModelRuntimeConfig();
    const baseUrl = runtimeConfig.modelUrl?.replace(/\/v1\/?$/, "") || "http://127.0.0.1:11434";
    const url = `${baseUrl}/api/embeddings`;
    const model = runtimeConfig.embeddingModel;

    const geminiApiKey = process.env.GEMINI_API_KEY;

    try {
      if (geminiApiKey) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const genModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await genModel.embedContent(text);
        return EmbeddingService.validateEmbedding(result.embedding.values);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate embedding: ${response.statusText}`);
      }

      const data = await response.json();
      return EmbeddingService.validateEmbedding(data.embedding);
    } catch (error) {
      console.error("[EmbeddingService] Error generating embedding:", error);
      throw error;
    }
  }

  private static validateEmbedding(value: unknown): number[] {
    if (
      !Array.isArray(value) ||
      value.length !== EMBEDDING_DIMENSION ||
      value.some((item) => typeof item !== "number" || !Number.isFinite(item))
    ) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION} numeric values.`,
      );
    }

    return value;
  }

  /**
   * Simplistic chunker for markdown text.
   * Splits by paragraphs, keeping chunks within a rough character limit.
   */
  static chunkText(text: string, maxChunkLength = 1000): string[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
      if (currentChunk.length + p.length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      currentChunk += (currentChunk ? "\n\n" : "") + p;
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
