import { pgTable, uuid, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { conversationMessages } from "./messages.js";

export const messageFeedbacks = pgTable("message_feedbacks", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id").references(() => conversationMessages.id, { onDelete: "cascade" }).notNull(),
  isPositive: boolean("is_positive").notNull(),
  reason: text("reason"),
  correctedResponse: text("corrected_response"), // MDA-069
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
