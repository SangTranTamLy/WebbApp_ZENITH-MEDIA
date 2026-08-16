import { env } from "../../config/env.js";
import {createSupabaseAdminClient,createSupabaseClient,createSupabaseUserClient,} from "../../config/supabase.js";
import type {LoginInput,RegisterInput,} from "./auth.schema.js";
import type {LoginResult,RegisterResult,} from "./auth.types.js";
type RegisterServiceResult =
  | {
      data: RegisterResult;
      error: null;
    }
  | {
      data: null;
      error: {
        statusCode: number;
        message: string;
      };
    };

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterServiceResult> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,

    options: {
      emailRedirectTo:
        `${env.WEB_URL}/login?verified=true`,

      data: {
        username: input.username,
        display_name: input.displayName,
      },
    },
  });

    if (error) {
    console.error("[SUPABASE_SIGNUP_ERROR]", {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
    });

    return {
        data: null,
        error: {
        statusCode: error.status ?? 400,
        message:
            process.env.NODE_ENV === "development"
            ? error.message
            : normalizeRegistrationError(error.message),
        },
    };
    }

  if (!data.user) {
    return {
      data: null,
      error: {
        statusCode: 500,
        message: "Không thể tạo tài khoản",
      },
    };
  }

  return {
    data: {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        emailVerified: Boolean(data.user.email_confirmed_at),
      },
      requiresEmailVerification: data.session === null,
    },
    error: null,
  };
}

type LoginServiceResult =
  | {
      data: LoginResult;
      error: null;
    }
  | {
      data: null;
      error: {
        statusCode: number;
        message: string;
      };
    };

export async function loginUser(
  input: LoginInput,
): Promise<LoginServiceResult> {
  const email = await resolveLoginEmail(input.identifier);

  if (!email) {
    return invalidCredentialsResult();
  }

  const supabase = createSupabaseClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

  if (error || !data.user || !data.session) {
    console.error("[SUPABASE_LOGIN_ERROR]", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
    });

    if (
      error?.message
        .toLowerCase()
        .includes("email not confirmed")
    ) {
      return {
        data: null,
        error: {
          statusCode: 403,
          message: "Bạn cần xác minh email trước khi đăng nhập",
        },
      };
    }

    return invalidCredentialsResult();
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        `
          id,
          username,
          display_name,
          avatar_url,
          role,
          status
        `,
      )
      .eq("id", data.user.id)
      .single();

  if (profileError || !profile) {
    console.error(
      "[LOGIN_PROFILE_ERROR]",
      profileError,
    );

    return {
      data: null,
      error: {
        statusCode: 500,
        message: "Không thể tải hồ sơ người dùng",
      },
    };
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();

    return {
      data: null,
      error: {
        statusCode: 403,
        message: "Tài khoản hiện không hoạt động",
      },
    };
  }

  return {
    data: {
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
        emailVerified: Boolean(
          data.user.email_confirmed_at,
        ),
      },

      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
        status: profile.status,
      },

      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    },

    error: null,
  };
}

async function resolveLoginEmail(
  identifier: string,
): Promise<string | null> {
  const normalizedIdentifier =
    identifier.trim().toLowerCase();

  if (normalizedIdentifier.includes("@")) {
    return normalizedIdentifier;
  }

  const admin = createSupabaseAdminClient();

  const { data: profile, error: profileError } =
    await admin
      .from("profiles")
      .select("id")
      .eq("username", normalizedIdentifier)
      .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data, error } =
    await admin.auth.admin.getUserById(profile.id);

  if (error || !data.user.email) {
    return null;
  }

  return data.user.email;
}

function invalidCredentialsResult(): LoginServiceResult {
  return {
    data: null,
    error: {
      statusCode: 401,
      message: "Email, username hoặc mật khẩu không chính xác",
    },
  };
}

type LogoutScope = "local" | "global";

export async function logoutUser(
  accessToken: string,
  scope: LogoutScope,
): Promise<{
  success: boolean;
  message?: string;
}> {
  const admin = createSupabaseAdminClient();

  const { error } =
    await admin.auth.admin.signOut(
      accessToken,
      scope,
    );

  if (error) {
    console.error("[SUPABASE_LOGOUT_ERROR]", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    return {
      success: false,
      message: "Không thể thu hồi phiên đăng nhập",
    };
  }

  return {
    success: true,
  };
}

function normalizeRegistrationError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("duplicate") ||
    normalized.includes("username")
  ) {
    return "Username đã được sử dụng";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists")
  ) {
    return "Không thể đăng ký bằng thông tin này";
  }

  if (
    normalized.includes("password") ||
    normalized.includes("weak")
  ) {
    return "Mật khẩu chưa đáp ứng yêu cầu bảo mật";
  }

  if (normalized.includes("email")) {
    return "Email không hợp lệ hoặc không thể sử dụng";
  }

  return "Không thể đăng ký tài khoản. Vui lòng thử lại";
}

export async function getCurrentProfile(
  accessToken: string,
  userId: string,
) {
  const supabase =
    createSupabaseUserClient(accessToken);

  const { data: profile, error } =
    await supabase
      .from("profiles")
      .select(
        `
          id,
          username,
          display_name,
          avatar_url,
          role,
          status,
          created_at,
          updated_at
        `,
      )
      .eq("id", userId)
      .single();

  if (error || !profile) {
    console.error("[GET_CURRENT_PROFILE_ERROR]", {
      message: error?.message,
      code: error?.code,
    });

    return {
      data: null,
      error: {
        statusCode: 404,
        message: "Không tìm thấy hồ sơ người dùng",
      },
    };
  }

  if (profile.status !== "active") {
    return {
      data: null,
      error: {
        statusCode: 403,
        message: "Tài khoản hiện không hoạt động",
      },
    };
  }

  return {
    data: {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
    error: null,
  };
}

export async function refreshUserSession(
  refreshToken: string,
) {
  const supabase = createSupabaseClient();

  const {
    data,
    error,
  } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    return {
      data: null,
      error: {
        statusCode: 401,
        message:
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
      },
    };
  }

  const profileResult = await getCurrentProfile(
    data.session.access_token,
    data.user.id,
  );

  if (profileResult.error || !profileResult.data) {
    return {
      data: null,
      error: {
        statusCode:
          profileResult.error?.statusCode ?? 403,
        message:
          profileResult.error?.message ??
          "Không thể truy cập hồ sơ người dùng",
      },
    };
  }

  return {
    data: {
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
        emailVerified: Boolean(
          data.user.email_confirmed_at,
        ),
      },
      profile: profileResult.data,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    },
    error: null,
  };
}

type ResendVerificationResult =
  | {
      success: true;
    }
  | {
      success: false;
      statusCode: number;
      message: string;
    };


export async function resendVerificationEmail(
  email: string,
): Promise<ResendVerificationResult> {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo:
        `${env.WEB_URL}/login?verified=true`,
    },
  });


  if (!error) {
    return {
      success: true,
    };
  }


  if (error.status === 429) {
    return {
      success: false,
      statusCode: 429,
      message:
        "Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau.",
    };
  }


  /*
   * Không trả thông báo như "email không tồn tại",
   * tránh để người khác dò tài khoản trong hệ thống.
   */
  console.error(
    "[AUTH_RESEND_VERIFICATION]",
    error.message,
  );


  return {
    success: true,
  };
}

type ForgotPasswordResult =
  | {
      success: true;
    }
  | {
      success: false;
      statusCode: number;
      message: string;
    };


export async function requestPasswordReset(
  email: string,
): Promise<ForgotPasswordResult> {
  const supabase = createSupabaseClient();

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          env.PASSWORD_RESET_REDIRECT_URL,
      },
    );


  if (!error) {
    return {
      success: true,
    };
  }


  if (error.status === 429) {
    return {
      success: false,
      statusCode: 429,
      message:
        "Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau.",
    };
  }


  /*
   * Không tiết lộ email có tồn tại hay không.
   */
  console.error(
    "[AUTH_FORGOT_PASSWORD]",
    error.message,
  );


  return {
    success: true,
  };
}
