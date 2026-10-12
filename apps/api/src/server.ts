import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import { getModelRuntimeConfig } from "./services/model-config.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/+$/, "");

const corsOrigins = [
  ...(process.env.CORS_ORIGINS || "").split(","),
  process.env.WEB_URL || "",
  "https://zenith.io.vn",
  "https://www.zenith.io.vn",
  ...(process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173"]),
]
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error("Origin is not allowed by CORS policy."));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);
app.use(express.json({ limit: "1mb" }));

import { requireAuth } from "./middlewares/auth.middleware.js";
// Inject user context for all routes
app.use(requireAuth);

import chatRoutes from "./routes/chat.routes.js";

// Health Check
const healthCheck = (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok", service: "MDA AI Chatbot API" });
};

app.get("/health", healthCheck);
app.get("/api/health", healthCheck);

const readinessCheck = async (_req: express.Request, res: express.Response) => {
  const checks: Record<string, string> = {};

  try {
    const model = getModelRuntimeConfig();
    checks.model = model.hasGeminiKey || model.modelUrl ? "configured" : "missing";
  } catch (error) {
    checks.model = error instanceof Error ? error.message : "not_configured";
  }

  try {
    await db.execute(sql`select 1`);
    checks.database = "ok";
  } catch {
    checks.database = "unreachable";
  }

  const ready = checks.model === "configured" && checks.database === "ok";
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks,
  });
};

app.get("/ready", readinessCheck);
app.get("/api/ready", readinessCheck);

import feedbackRoutes from "./routes/feedback.routes.js";
app.use("/api/chat", chatRoutes);
app.use("/api/feedback", feedbackRoutes);

app.listen(port, "0.0.0.0", () => {
  console.log(`MDA API is running on port ${port}`);
});
