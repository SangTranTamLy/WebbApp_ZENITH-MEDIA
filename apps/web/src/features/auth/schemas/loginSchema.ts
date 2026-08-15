import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email hoặc username.")
    .min(3, "Email hoặc username phải có ít nhất 3 ký tự.")
    .max(120, "Email hoặc username không được vượt quá 120 ký tự."),

  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
    .max(72, "Mật khẩu không được vượt quá 72 ký tự."),

  remember: z.boolean(),
});

export type LoginFormValues = z.infer<
  typeof loginSchema
>;