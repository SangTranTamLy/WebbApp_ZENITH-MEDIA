export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
};

export function successResponse<T>(
  data: T,
  message = "Thành công",
): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(
  message: string,
  code = "API_ERROR",
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined
        ? { details }
        : {}),
    },
  };
}