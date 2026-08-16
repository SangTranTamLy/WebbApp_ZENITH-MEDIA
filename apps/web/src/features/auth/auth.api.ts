import {apiRequest,type ApiSuccessResponse,} from "../../services/httpClient";
import type {AuthSessionData,LoginRequest,LogoutRequest,RegisterRequest,RegisterResponseData,} from "./auth.types";

export function loginRequest(
  input: LoginRequest,
): Promise<ApiSuccessResponse<AuthSessionData>> {
  return apiRequest<AuthSessionData>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getCurrentSessionRequest(): Promise<
  ApiSuccessResponse<AuthSessionData>
> {
  return apiRequest<AuthSessionData>(
    "/api/auth/me",
  );
}

let refreshRequestPromise: Promise<
  ApiSuccessResponse<AuthSessionData>
> | null = null;

export function refreshSessionRequest(): Promise<
  ApiSuccessResponse<AuthSessionData>
> {
  if (!refreshRequestPromise) {
    refreshRequestPromise =
      apiRequest<AuthSessionData>(
        "/api/auth/refresh",
        {
          method: "POST",
        },
      ).finally(() => {
        refreshRequestPromise = null;
      });
  }

  return refreshRequestPromise;
}

export function logoutRequest(
  input: LogoutRequest = {
    allDevices: false,
  },
): Promise<ApiSuccessResponse<undefined>> {
  return apiRequest<undefined>(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function registerRequest(
  input: RegisterRequest,
): Promise<
  ApiSuccessResponse<RegisterResponseData>
> {
  return apiRequest<RegisterResponseData>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function resendVerificationRequest(
  email: string,
): Promise<void> {
  await apiRequest<unknown>(
    "/api/auth/resend-verification",
    {
      method: "POST",


      body: JSON.stringify({
        email,
      }),
    },
  );
}

export async function forgotPasswordRequest(
  email: string,
): Promise<void> {
  await apiRequest<unknown>(
    "/api/auth/forgot-password",
    {
      method: "POST",


      body: JSON.stringify({
        email,
      }),
    },
  );
}
