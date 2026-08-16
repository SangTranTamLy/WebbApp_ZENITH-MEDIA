import { z } from "zod";


export const resetPasswordSchema = z
  .object({
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
        "Mật khẩu không được vượt quá 64 ký tự.",
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


export type ResetPasswordFormValues =
  z.infer<typeof resetPasswordSchema>;
