import type {
  CookieOptions,
  Request,
  Response,
} from "express";
import { env } from "../../config/env.js";

export const ACCESS_COOKIE = "zenith_access_token";
export const REFRESH_COOKIE = "zenith_refresh_token";
export const REMEMBER_COOKIE = "zenith_remember";

const DEFAULT_ACCESS_TOKEN_SECONDS = 60 * 60;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function getBaseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
  };
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  remember: boolean,
  expiresInSeconds = DEFAULT_ACCESS_TOKEN_SECONDS,
): void {
  const baseOptions = getBaseCookieOptions();

  response.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    path: "/",
    ...(remember
      ? {
          maxAge: expiresInSeconds * 1000,
        }
      : {}),
  });

  response.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    path: "/api/auth",
    ...(remember
      ? {
          maxAge: REFRESH_TOKEN_MAX_AGE,
        }
      : {}),
  });

  response.cookie(REMEMBER_COOKIE, remember ? "1" : "0", {
    ...baseOptions,
    signed: true,
    path: "/api/auth",
    ...(remember
      ? {
          maxAge: REFRESH_TOKEN_MAX_AGE,
        }
      : {}),
  });
}

export function clearAuthCookies(response: Response): void {
  const baseOptions = getBaseCookieOptions();

  response.clearCookie(ACCESS_COOKIE, {
    ...baseOptions,
    path: "/",
  });

  response.clearCookie(REFRESH_COOKIE, {
    ...baseOptions,
    path: "/api/auth",
  });

  response.clearCookie(REMEMBER_COOKIE, {
    ...baseOptions,
    path: "/api/auth",
  });
}

export function getRememberPreference(request: Request): boolean {
  return request.signedCookies?.[REMEMBER_COOKIE] === "1";
}