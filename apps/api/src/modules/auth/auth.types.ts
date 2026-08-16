import type { Request } from "express";

export type LoginProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
};

export type LoginResult = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };

  profile: LoginProfile;

  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};

export type RegisteredUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
};

export type RegisterResult = {
  user: RegisteredUser;
  requiresEmailVerification: boolean;
};

export type AuthenticatedRequest = Request & {
  auth: {
    userId: string;
    email: string | null;
    accessToken: string;
  };
};