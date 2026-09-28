import { pgTable, uuid, text, timestamp, varchar, jsonb, integer, customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id"),
  title: text("title").notNull(),
  sourceType: varchar("source_type", { length: 100 }).notNull(),
  sourceUri: text("source_uri"),
  visibility: varchar("visibility", { length: 50 }).default("PUBLIC").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  checksum: varchar("checksum", { length: 255 }),
  status: varchar("status", { length: 50 }).default("PROCESSING"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => knowledgeDocuments.id, { onDelete: "cascade" }).notNull(),
  chunkIndex: integer("chunk_index"),
  content: text("content").notNull(),
  embedding: vector("embedding"), // OpenAPI text-embedding-3-small dimension
  tokenCount: integer("token_count"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
