import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ApiRequestError } from "../../services/httpClient";
import {
  getCurrentSessionRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
} from "./auth.api";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./auth.context";
import type {
  AuthSessionData,
  LoginRequest,
} from "./auth.types";

type AuthProviderProps = {
  children: ReactNode;
};

let authBootstrapPromise:
  | Promise<AuthSessionData | null>
  | null = null;

async function bootstrapAuthSession(): Promise<
  AuthSessionData | null
> {
  if (authBootstrapPromise) {
    return authBootstrapPromise;
  }

  authBootstrapPromise = (async () => {
    try {
      const response =
        await getCurrentSessionRequest();

      return response.data;
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.status === 401
      ) {
        try {
          const response =
            await refreshSessionRequest();

          return response.data;
        } catch (refreshError) {
          if (
            refreshError instanceof ApiRequestError &&
            refreshError.status === 401
          ) {
            return null;
          }

          throw refreshError;
        }
      }

      throw error;
    }
  })();

  try {
    return await authBootstrapPromise;
  } finally {
    authBootstrapPromise = null;
  }
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [status, setStatus] =
    useState<AuthStatus>("loading");

  const [session, setSession] =
    useState<AuthSessionData | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadInitialSession() {
      try {
        const initialSession =
          await bootstrapAuthSession();

        if (isActive) {
          setSession(initialSession);
          setStatus(
            initialSession
              ? "authenticated"
              : "unauthenticated",
          );
          setError(null);
        }
      } catch (error) {
        console.error(
          "Không thể kiểm tra phiên đăng nhập:",
          error,
        );

        if (isActive) {
          setSession(null);
          setStatus("unauthenticated");
          setError(
            error instanceof Error
              ? error.message
              : "Không thể kiểm tra phiên đăng nhập",
          );
        }
      } finally {
        if (isActive) {
          setStatus((current) =>
            current === "loading"
              ? "unauthenticated"
              : current,
          );
        }
      }
    }

    void loadInitialSession();

    return () => {
      isActive = false;
    };
  }, []);

  const signIn = useCallback(
    async (
      input: LoginRequest,
    ): Promise<AuthSessionData> => {
      setError(null);

      const response = await loginRequest(input);

      setSession(response.data);
      setStatus("authenticated");

      return response.data;
    },
    [],
  );

  const signOut = useCallback(
    async (allDevices = false): Promise<void> => {
      setError(null);

      try {
        await logoutRequest({
          allDevices,
        });
      } finally {
        setSession(null);
        setStatus("unauthenticated");
      }
    },
    [],
  );

  const refreshSession = useCallback(
    async (): Promise<AuthSessionData | null> => {
      setError(null);

      try {
        const response =
          await refreshSessionRequest();

        setSession(response.data);
        setStatus("authenticated");

        return response.data;
      } catch (refreshError) {
        const isUnauthorized =
          refreshError instanceof ApiRequestError &&
          refreshError.status === 401;

        if (isUnauthorized) {
          setSession(null);
          setStatus("unauthenticated");

          return null;
        }

        const message =
          refreshError instanceof Error
            ? refreshError.message
            : "Không thể làm mới phiên đăng nhập";

        setError(message);

        throw refreshError;
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile: session?.profile ?? null,
      error,
      isLoading: status === "loading",
      isAuthenticated:
        status === "authenticated",
      signIn,
      signOut,
      refreshSession,
    }),
    [
      status,
      session,
      error,
      signIn,
      signOut,
      refreshSession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
