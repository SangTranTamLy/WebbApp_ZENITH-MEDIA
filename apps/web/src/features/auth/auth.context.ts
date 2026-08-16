import { createContext } from "react";
import type {
  AuthProfile,
  AuthSessionData,
  AuthUser,
  LoginRequest,
} from "./auth.types";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

export type AuthContextValue = {
  status: AuthStatus;
  session: AuthSessionData | null;
  user: AuthUser | null;
  profile: AuthProfile | null;
  error: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (
    input: LoginRequest,
  ) => Promise<AuthSessionData>;

  signOut: (
    allDevices?: boolean,
  ) => Promise<void>;

  refreshSession:
    () => Promise<AuthSessionData | null>;
};

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );