import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(4000),

  WEB_URL: z
    .string()
    .url("WEB_URL phải là một URL hợp lệ."),

  PASSWORD_RESET_REDIRECT_URL: z
    .string()
    .url(
      "PASSWORD_RESET_REDIRECT_URL không hợp lệ",
    ),

  SUPABASE_URL: z
    .string()
    .url("SUPABASE_URL phải là một URL hợp lệ."),

  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(
      1,
      "SUPABASE_PUBLISHABLE_KEY không được để trống.",
    ),
    SUPABASE_SECRET_KEY: z
    .string()
    .startsWith(
        "sb_secret_",
        "SUPABASE_SECRET_KEY không hợp lệ",
    ),
    COOKIE_SECRET: z.string().min(
        32,
        "COOKIE_SECRET phải có ít nhất 32 ký tự",
    ),
});

const parsedEnvironment = envSchema.safeParse(
  process.env,
);

if (!parsedEnvironment.success) {
  console.error(
    "Cấu hình biến môi trường không hợp lệ:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  throw new Error(
    "Không thể khởi động API vì biến môi trường không hợp lệ.",
  );
}

export const env = parsedEnvironment.data;

export const isProduction =
  env.NODE_ENV === "production";

export const isDevelopment =
  env.NODE_ENV === "development";
