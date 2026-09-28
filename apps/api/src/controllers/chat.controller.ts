import type { Request, Response } from "express";
import { AIService } from "../services/ai.service.js";
// import { db } from "../db"; // We will use this to save messages later

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

      // The public endpoint never accepts a caller-provided role. Private mode
      // must not be reachable by changing JSON in the browser.
      const publicMessages = messages.slice(-24);

      // 1. Setup SSE Headers
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Content-Type-Options", "nosniff");

      // 2. Fetch the stream from AI Service
      const stream = AIService.generateChatStream(publicMessages, "PUBLIC");

      // 3. Process the stream and send chunks to client
      for await (const chunk of stream) {
        const content = chunk.text();
        if (content) {
          // Format for SSE
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }

      // 4. Conclude the stream
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
