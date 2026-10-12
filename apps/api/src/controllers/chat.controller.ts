import type { Request, Response } from "express";
import { AIService } from "../services/ai.service.js";
import { db } from "../db/index.js";
import { conversations, conversationMessages } from "../db/schema/index.js";
import crypto from "crypto";

export class ChatController {
  static async handleChatStream(req: Request, res: Response) {
    console.log("RECEIVED REQUEST:", new Date().toISOString());
    try {
      const { messages } = req.body ?? {};
      console.log("Messages length:", messages?.length);

      if (
        !Array.isArray(messages) ||
        messages.length > 24 ||
        messages.some(
          (message) =>
            !message ||
            typeof message !== "object" ||
            typeof message.content !== "string" ||
            message.content.length > 8000,
        )
      ) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      // Lọc các role không được phép từ client
      const filteredMessages = messages
        .filter((msg) => msg && !["system", "developer", "tool"].includes(msg.role))
        .map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user", // Force role to user/assistant
          content: msg.content,
        }));

      // The public endpoint never accepts a caller-provided role. Private mode
      // must not be reachable by changing JSON in the browser.
      const publicMessages = filteredMessages.slice(-24);

      // 1. Setup SSE Headers
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Content-Type-Options", "nosniff");

      // 2. Fetch the stream from AI Service
      const role = (req as any).user?.role === "OWNER" ? "PRIVATE" : "PUBLIC";
      const sessionId = (req as any).user?.id || req.headers["x-session-id"] || "anonymous";

      const conversationId = req.body.conversationId ?? crypto.randomUUID();
      const messageId = crypto.randomUUID();

      // Ensure conversation exists, then save the latest user message
      db.insert(conversations)
        .values({ id: conversationId, sessionId, title: "Chat", visibility: role })
        .onConflictDoNothing()
        .then(() => {
          const userMsg = publicMessages[publicMessages.length - 1];
          if (userMsg) {
            return db.insert(conversationMessages).values({
              conversationId,
              role: "user",
              content: userMsg.content,
            });
          }
        })
        .catch((e) => console.error("[Chat DB] Error saving user message:", e));

      // Send initial metadata chunk with messageId to frontend for feedback
      res.write(`data: ${JSON.stringify({ metadata: { messageId, conversationId } })}\n\n`);

      const stream = AIService.generateChatStream(publicMessages, role);
      let fullAssistantContent = "";

      // 3. Process the stream and send chunks to client
      for await (const chunk of stream) {
        if (chunk.sources?.length) {
          res.write(`data: ${JSON.stringify({ sources: chunk.sources })}\n\n`);
        }
        const content = chunk.text?.();
        if (content) {
          fullAssistantContent += content;
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }

      // 4. Conclude the stream and save assistant message
      db.insert(conversationMessages)
        .values({
          id: messageId,
          conversationId,
          role: "assistant",
          content: fullAssistantContent,
        })
        .catch((e) => console.error("[Chat DB] Error saving assistant message:", e));

      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error) {
      console.error("Chat Stream Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
      }
    }
  }
}
