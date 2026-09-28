import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  visibility: varchar("visibility", { length: 50 }).default("PUBLIC").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
