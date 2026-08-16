import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { createSupabaseClient } from "../../config/supabase.js";
import { ACCESS_COOKIE } from "./auth.cookies.js";
import type { AuthenticatedRequest } from "./auth.types.js";

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accessToken =
      request.cookies?.[ACCESS_COOKIE];

    if (
      typeof accessToken !== "string" ||
      accessToken.length === 0
    ) {
      response.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập",
        error: {
          code: "AUTH_REQUIRED",
        },
      });

      return;
    }

    const supabase = createSupabaseClient();

    const { data, error } =
      await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      response.status(401).json({
        success: false,
        message:
          "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
        error: {
          code: "INVALID_SESSION",
        },
      });

      return;
    }

    const authenticatedRequest =
      request as AuthenticatedRequest;

    authenticatedRequest.auth = {
      userId: data.user.id,
      email: data.user.email ?? null,
      accessToken,
    };

    next();
  } catch (error) {
    next(error);
  }
}