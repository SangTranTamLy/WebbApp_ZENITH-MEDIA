import { z } from "zod";
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1,"Vui lòng nhập email hoặc username",)
    .max(254,"Email hoặc username không hợp lệ",),

  password: z
    .string()
    .min(8,"Mật khẩu phải có ít nhất 8 ký tự",)
    .max(64,"Mật khẩu không được vượt quá 64 ký tự",),

  remember: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
      .max(60, "Tên hiển thị không được quá 60 ký tự"),

    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(20, "Username không được quá 20 ký tự")
      .regex(
        /^[a-z0-9_]+$/,
        "Username chỉ được chứa chữ thường, số và dấu gạch dưới",
      ),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Email không hợp lệ")
      .max(254, "Email quá dài"),

    password: z
        .string()
        .min(8,"Mật khẩu phải có ít nhất 8 ký tự",)
        .max(64,"Mật khẩu không được vượt quá 64 ký tự",),

        confirmPassword: z
        .string()
        .min(1, "Vui lòng xác nhận mật khẩu")
        .max(64,"Mật khẩu xác nhận không được vượt quá 64 ký tự",),

    acceptedTerms: z.literal(true, {
      error: "Bạn phải đồng ý với điều khoản sử dụng",
    }),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Mật khẩu xác nhận không khớp",
    },
  );

export type RegisterInput = z.infer<typeof registerSchema>;

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ")
    .max(254, "Email không hợp lệ"),
});


export type ResendVerificationInput = z.infer<
  typeof resendVerificationSchema
>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ")
    .max(254, "Email không hợp lệ"),
});


export type ForgotPasswordInput = z.infer<
  typeof forgotPasswordSchema
>;
