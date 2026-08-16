import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(
        2,
        "Tên hiển thị phải có ít nhất 2 ký tự.",
      )
      .max(
        50,
        "Tên hiển thị không được vượt quá 50 ký tự.",
      ),

    username: z
      .string()
      .trim()
      .min(
        3,
        "Username phải có ít nhất 3 ký tự.",
      )
      .max(
        20,
        "Username không được vượt quá 20 ký tự.",
      )
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username chỉ gồm chữ, số và dấu gạch dưới.",
      ),

    email: z
      .string()
      .trim()
      .min(
        1,
        "Vui lòng nhập email.",
      )
      .email(
        "Địa chỉ email không hợp lệ.",
      )
      .max(
        254,
        "Địa chỉ email quá dài.",
      ),

    password: z
      .string()
      .min(
        8,
        "Mật khẩu phải có ít nhất 8 ký tự.",
      )
      .max(
        64,
        "Mật khẩu không được vượt quá 64 ký tự.",
      ),

    confirmPassword: z
      .string()
      .min(
        1,
        "Vui lòng xác nhận mật khẩu.",
      )
      .max(
        64,
        "Mật khẩu xác nhận không được vượt quá 64 ký tự.",
      ),

    acceptedTerms: z
      .boolean()
      .refine(
        (value) => value,
        "Bạn phải đồng ý với điều khoản sử dụng.",
      ),
  })
  .refine(
    (values) =>
      values.password ===
      values.confirmPassword,
    {
      path: ["confirmPassword"],
      message:
        "Mật khẩu xác nhận không khớp.",
    },
  );

export type RegisterFormValues = z.infer<
  typeof registerSchema
>;