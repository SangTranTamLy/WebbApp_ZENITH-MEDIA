import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { ChatController } from "../controllers/chat.controller.js";

const router: Router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau." },
});

// Endpoint for sending chat messages and receiving an SSE stream
router.post("/", chatLimiter, ChatController.handleChatStream);

export default router;
