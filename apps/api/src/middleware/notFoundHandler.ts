import type {
  Request,
  Response,
} from "express";

import { errorResponse } from "../shared/apiResponse.js";

export function notFoundHandler(
  request: Request,
  response: Response,
) {
  response.status(404).json(
    errorResponse(
      `Không tìm thấy API ${request.method} ${request.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
}