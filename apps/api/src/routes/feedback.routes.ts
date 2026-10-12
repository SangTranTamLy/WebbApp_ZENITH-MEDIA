import express, { type Router } from "express";
import { db } from "../db/index.js";
import { messageFeedbacks } from "../db/schema/feedbacks.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router: Router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { messageId, isPositive, reason, correctedResponse } = req.body;

    if (!messageId || typeof isPositive !== "boolean") {
      res.status(400).json({ error: "Missing messageId or isPositive" });
      return;
    }

    // Insert or update feedback
    await db.insert(messageFeedbacks).values({
      messageId,
      isPositive,
      reason,
      correctedResponse,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Feedback] Error saving feedback:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

export default router;
