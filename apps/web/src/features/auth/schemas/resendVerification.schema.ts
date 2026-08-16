import { z } from "zod";


export const resendVerificationSchema =
  z.object({
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email.")
      .email("Email không hợp lệ.")
      .max(254, "Email không hợp lệ."),
  });


export type ResendVerificationFormValues =
  z.infer<typeof resendVerificationSchema>;
