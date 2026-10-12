const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type ModelRuntimeConfig = {
  modelUrl: string | null;
  modelName: string;
  embeddingModel: string;
  hasGeminiKey: boolean;
};

const isProduction = (): boolean => process.env.NODE_ENV === "production";

const isLoopbackUrl = (value: string): boolean => {
  try {
    return LOOPBACK_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return true;
  }
};

/**
 * Resolve the model configuration without ever hiding a production misconfiguration
 * behind the local Ollama fallback.
 */
export function getModelRuntimeConfig(): ModelRuntimeConfig {
  const modelUrl = process.env.AI_MODEL_URL?.trim() || null;
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";

  if (modelUrl) {
    let parsed: URL;
    try {
      parsed = new URL(modelUrl);
    } catch {
      throw new Error("AI_MODEL_URL must be an absolute HTTP(S) URL.");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("AI_MODEL_URL must use HTTP or HTTPS.");
    }

    if (isProduction() && isLoopbackUrl(modelUrl)) {
      throw new Error("Production AI_MODEL_URL cannot point to localhost or loopback.");
    }
  }

  if (isProduction() && !modelUrl && !geminiKey) {
    throw new Error(
      "Production model is not configured. Set GEMINI_API_KEY or a reachable AI_MODEL_URL.",
    );
  }

  return {
    modelUrl,
    modelName: process.env.AI_MODEL_NAME?.trim() || "qwen2.5:3b",
    embeddingModel: process.env.EMBEDDING_MODEL?.trim() || "nomic-embed-text",
    hasGeminiKey: Boolean(geminiKey),
  };
}
