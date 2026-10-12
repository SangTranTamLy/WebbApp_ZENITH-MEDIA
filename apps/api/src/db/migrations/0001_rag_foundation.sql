CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_documents_visibility_status_idx"
  ON "knowledge_documents" ("visibility", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_documents_source_uri_idx"
  ON "knowledge_documents" ("source_uri");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "knowledge_chunks_document_chunk_idx"
  ON "knowledge_chunks" ("document_id", "chunk_index");
