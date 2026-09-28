import express, { type Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";

const router: Router = express.Router();

// Endpoint for sending chat messages and receiving an SSE stream
router.post("/", ChatController.handleChatStream);

export default router;
