import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../config/env.js";
import { ApiError } from "../shared/ApiError.js";
import { errorResponse } from "../shared/apiResponse.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json(
      errorResponse(
        error.message,
        error.code,
        error.details,
      ),
    );

    return;
  }

  console.error("Unhandled API error:", error);

  const details =
    env.NODE_ENV === "development" &&
    error instanceof Error
      ? {
          name: error.name,
          stack: error.stack,
        }
      : undefined;

  response.status(500).json(
    errorResponse(
      "Máy chủ xảy ra lỗi.",
      "INTERNAL_SERVER_ERROR",
      details,
    ),
  );
}