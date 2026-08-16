export type AuthUser = {
  id: string;
  email: string | null;
  emailVerified?: boolean;
};

export type AuthProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "member" | "moderator" | "admin";
  status: "active" | "suspended" | "deleted";
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSessionData = {
  user: AuthUser;
  profile: AuthProfile;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  remember: boolean;
};

export type LogoutRequest = {
  allDevices: boolean;
};

export type RegisterRequest = {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type RegisterResponseData = {
  user: {
    id: string;
    email: string | null;
    emailVerified: boolean;
  };

  requiresEmailVerification: boolean;
};