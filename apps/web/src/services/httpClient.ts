export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error?: {
    code?: string;
  };
  errors?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: ApiErrorResponse["errors"];

  constructor(
    status: number,
    payload: ApiErrorResponse,
  ) {
    super(payload.message);

    this.name = "ApiRequestError";
    this.status = status;
    this.code = payload.error?.code;
    this.details = payload.errors;
  }
}

async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiSuccessResponse<T>> {
  const headers = new Headers(options.headers);

  if (
    options.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    headers,

    // Bắt buộc để trình duyệt gửi và nhận cookie HttpOnly
    credentials: "include",
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const errorPayload: ApiErrorResponse =
      payload &&
      typeof payload === "object" &&
      "message" in payload
        ? (payload as ApiErrorResponse)
        : {
            success: false,
            message: "Không thể kết nối đến máy chủ",
          };

    throw new ApiRequestError(
      response.status,
      errorPayload,
    );
  }

  return payload as ApiSuccessResponse<T>;
}