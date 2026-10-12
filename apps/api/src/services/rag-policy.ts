export const KNOWLEDGE_VISIBILITIES = ["PUBLIC", "PRIVATE", "SYSTEM"] as const;
export type KnowledgeVisibility = (typeof KNOWLEDGE_VISIBILITIES)[number];

export const KNOWLEDGE_READY_STATUSES = ["READY", "COMPLETED"] as const;
export type KnowledgeStatus =
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "ERROR";

export function isPublicReadyDocument(document: {
  visibility: string;
  status: string | null;
}): boolean {
  return (
    document.visibility === "PUBLIC" &&
    KNOWLEDGE_READY_STATUSES.includes(
      document.status as (typeof KNOWLEDGE_READY_STATUSES)[number],
    )
  );
}
