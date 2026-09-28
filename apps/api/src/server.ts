import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db/index.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

const corsOrigins = (process.env.CORS_ORIGINS || process.env.WEB_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : true }));
app.use(express.json({ limit: "1mb" }));

import chatRoutes from "./routes/chat.routes.js";

// Health Check
const healthCheck = (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok", service: "MDA AI Chatbot API" });
};

app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

// API Routes
app.use("/api/chat", chatRoutes);

app.listen(port, "0.0.0.0", () => {
  console.log(`MDA API is running on port ${port}`);
});
