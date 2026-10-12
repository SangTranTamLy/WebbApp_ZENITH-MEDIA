export type ChatMessage = { role: "user" | "assistant"; content: string };

// Only public display fields may cross the SSE boundary. Ingestion metadata can
// contain local paths, owner identifiers, or other internal information.
export type ChatSource = {
  documentId: string;
  title: string;
  sourceType: string;
  sourceUri: string | null;
  chunkIndex: number | null;
};

export type ChatChunk = {
  text?: () => string;
  sources?: ChatSource[];
};

export class ChatUnavailableError extends Error {
  constructor(public readonly code: "KNOWLEDGE_UNAVAILABLE" | "MODEL_UNAVAILABLE") {
    super(code);
    this.name = "ChatUnavailableError";
  }
}

export function abortable<T>(operation: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new Error("Request aborted"));
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(operation).then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
    if (signal.aborted) abort();
  });
}
