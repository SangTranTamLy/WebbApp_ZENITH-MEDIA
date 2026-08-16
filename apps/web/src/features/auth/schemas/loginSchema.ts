import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email hoặc username.")
    .max(254,"Email hoặc username không hợp lệ.",),

  password: z
    .string()
    .min(8, "Vui lòng nhập mật khẩu.")
    .max(64,"Mật khẩu không được vượt quá 64 ký tự.",),

  remember: z.boolean(),
});

export type LoginFormValues = z.infer<
  typeof loginSchema
>;