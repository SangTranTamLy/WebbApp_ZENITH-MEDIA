import { Router } from "express";
import {
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resendVerificationController,
} from "./auth.controller.js";
import {
  forgotPasswordRateLimit,
  resendVerificationRateLimit,
} from "./auth.rate-limit.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post(
  "/forgot-password",
  forgotPasswordRateLimit,
  forgotPasswordController,
);
authRouter.post(
  "/resend-verification",
  resendVerificationRateLimit,
  resendVerificationController,
);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
