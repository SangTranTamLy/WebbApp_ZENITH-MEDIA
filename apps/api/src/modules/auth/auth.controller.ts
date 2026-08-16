import type {NextFunction,Request,Response,} from "express";
import {forgotPasswordSchema,loginSchema,registerSchema,resendVerificationSchema,} from "./auth.schema.js";
import {ACCESS_COOKIE,clearAuthCookies,REFRESH_COOKIE,setAuthCookies,getRememberPreference,} from "./auth.cookies.js";
import {getCurrentProfile,loginUser,logoutUser,refreshUserSession,registerUser,requestPasswordReset,resendVerificationEmail,} from "./auth.service.js";
import type {AuthenticatedRequest,} from "./auth.types.js";
export async function registerController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validation = registerSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(422).json({
        success: false,
        message: "Thông tin đăng ký không hợp lệ",
        errors: validation.error.flatten().fieldErrors,
      });

      return;
    }

    const result = await registerUser(validation.data);

    if (result.error) {
      response.status(result.error.statusCode).json({
        success: false,
        message: result.error.message,
      });

      return;
    }

    response.status(201).json({
      success: true,
      message: result.data.requiresEmailVerification
        ? "Đăng ký thành công. Vui lòng kiểm tra email để xác minh"
        : "Đăng ký thành công",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validation = loginSchema.safeParse(
      request.body,
    );

    if (!validation.success) {
      response.status(422).json({
        success: false,
        message: "Thông tin đăng nhập không hợp lệ",
        errors:
          validation.error.flatten().fieldErrors,
      });

      return;
    }

    const result = await loginUser(validation.data);

    if (result.error) {
      response
        .status(result.error.statusCode)
        .json({
          success: false,
          message: result.error.message,
        });

      return;
    }
    const session = result.data.session;

    setAuthCookies(
    response,
    session.accessToken,
    session.refreshToken,
    validation.data.remember,
    session.expiresIn,
    );

    response.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: result.data.user,
        profile: result.data.profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accessToken =
      request.cookies?.[ACCESS_COOKIE];

    const allDevices =
      request.body?.allDevices === true;

    // Luôn xóa cookie kể cả token đã hết hạn
    clearAuthCookies(response);

    if (
      typeof accessToken !== "string" ||
      accessToken.length === 0
    ) {
      response.status(200).json({
        success: true,
        message: "Đã đăng xuất",
      });

      return;
    }

    const result = await logoutUser(
      accessToken,
      allDevices ? "global" : "local",
    );

    if (!result.success) {
      response.status(401).json({
        success: false,
        message:
          result.message ??
          "Không thể đăng xuất",
      });

      return;
    }

    response.status(200).json({
      success: true,
      message: allDevices
        ? "Đã đăng xuất khỏi tất cả thiết bị"
        : "Đã đăng xuất",
    });
  } catch (error) {
    clearAuthCookies(response);
    next(error);
  }
}

export async function meController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authenticatedRequest =
      request as AuthenticatedRequest;

    const result = await getCurrentProfile(
      authenticatedRequest.auth.accessToken,
      authenticatedRequest.auth.userId,
    );

    if (result.error) {
      response
        .status(result.error.statusCode)
        .json({
          success: false,
          message: result.error.message,
        });

      return;
    }

    response.status(200).json({
      success: true,
      message: "Lấy phiên đăng nhập thành công",
      data: {
        user: {
          id: authenticatedRequest.auth.userId,
          email: authenticatedRequest.auth.email,
        },

        profile: result.data,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken =
      request.cookies?.[REFRESH_COOKIE];

    if (
      typeof refreshToken !== "string" ||
      refreshToken.length === 0
    ) {
      clearAuthCookies(response);

      response.status(401).json({
        success: false,
        message: "Không tìm thấy phiên đăng nhập",
        error: {
          code: "REFRESH_TOKEN_MISSING",
        },
      });

      return;
    }

    const remember = getRememberPreference(request);
    const result =
      await refreshUserSession(refreshToken);

    if (result.error || !result.data) {
      clearAuthCookies(response);

      response
        .status(result.error?.statusCode ?? 401)
        .json({
          success: false,
          message:
            result.error?.message ??
            "Không thể làm mới phiên đăng nhập",
          error: {
            code: "SESSION_REFRESH_FAILED",
          },
        });

      return;
    }

    setAuthCookies(
      response,
      result.data.session.accessToken,
      result.data.session.refreshToken,
      remember,
      result.data.session.expiresIn,
    );

    response.status(200).json({
      success: true,
      message: "Làm mới phiên đăng nhập thành công",
      data: {
        user: result.data.user,
        profile: result.data.profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerificationController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validation =
      resendVerificationSchema.safeParse(
        request.body,
      );


    if (!validation.success) {
      response.status(422).json({
        success: false,
        message: "Email không hợp lệ",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });


      return;
    }


    const result =
      await resendVerificationEmail(
        validation.data.email,
      );


    if (!result.success) {
      response
        .status(result.statusCode)
        .json({
          success: false,
          message: result.message,
        });


      return;
    }


    /*
     * Luôn trả cùng một thông báo dù email
     * có tồn tại hay không.
     */
    response.status(200).json({
      success: true,
      message:
        "Nếu tài khoản tồn tại và chưa được xác minh, hệ thống sẽ gửi lại email xác minh.",
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const validation =
      forgotPasswordSchema.safeParse(
        request.body,
      );


    if (!validation.success) {
      response.status(422).json({
        success: false,
        message: "Email không hợp lệ",
        errors:
          validation.error.flatten()
            .fieldErrors,
      });


      return;
    }


    const result =
      await requestPasswordReset(
        validation.data.email,
      );


    if (!result.success) {
      response
        .status(result.statusCode)
        .json({
          success: false,
          message: result.message,
        });


      return;
    }


    /*
     * Luôn dùng thông báo trung lập để
     * ngăn dò email tài khoản.
     */
    response.status(200).json({
      success: true,
      message:
        "Nếu email thuộc một tài khoản hợp lệ, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.",
    });
  } catch (error) {
    next(error);
  }
}
