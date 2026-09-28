import { pgTable, uuid, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

export const memories = pgTable("memories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  type: varchar("type", { length: 100 }).notNull(),
  content: text("content").notNull(),
  source: text("source"),
  confidence: integer("confidence").default(100),
  visibility: varchar("visibility", { length: 50 }).default("PRIVATE").notNull(),
  status: varchar("status", { length: 50 }).default("APPROVED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memoryCandidates = pgTable("memory_candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  conversationId: uuid("conversation_id"),
  candidateType: varchar("candidate_type", { length: 100 }).notNull(),
  candidateContent: text("candidate_content").notNull(),
  confidence: integer("confidence"),
  status: varchar("status", { length: 50 }).default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});
