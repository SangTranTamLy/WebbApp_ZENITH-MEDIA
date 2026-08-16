import { rateLimit } from "express-rate-limit";
import { env } from "../../config/env.js";


const isProduction =
  env.NODE_ENV === "production";


export const resendVerificationRateLimit =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,


    standardHeaders: "draft-8",
    legacyHeaders: false,


    message: {
      success: false,
      message:
        "Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau 15 phút.",
      error: {
        code: "AUTH_RATE_LIMITED",
      },
    },
  });

export const forgotPasswordRateLimit =
  rateLimit({
    windowMs: isProduction
      ? 15 * 60 * 1000
      : 60 * 1000,


    limit: isProduction ? 5 : 20,


    standardHeaders: "draft-7",
    legacyHeaders: false,


    message: {
      success: false,
      message:
        "Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.",
      error: {
        code: "PASSWORD_RESET_RATE_LIMITED",
      },
    },
  });
