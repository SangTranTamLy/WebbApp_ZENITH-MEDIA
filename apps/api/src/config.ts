import { z } from "zod";

export interface Config {
  demo: boolean;
  port: number;
  origin: string;
  databaseUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseServiceKey: string;
  adminId: string;
  workerSecret: string;
  bankAccount: string;
  bankName: string;
  bankBin: string;
  r2Endpoint: string;
  r2Key: string;
  r2Secret: string;
  productsBucket: string;
  previewsBucket: string;
  previewOrigin: string;
  resendKey: string;
  emailFrom: string;
  discordAdmin: string;
  discordCommunity: string;
}
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const demo = env.SHOP_DEMO === "true";
  if (demo && env.NODE_ENV === "production")
    throw new Error("Demo mode is forbidden in production.");
  const config: Config = {
    demo,
    port: Number(env.PORT || 4000),
    origin: env.SHOP_WEB_ORIGIN || "http://127.0.0.1:5173",
    databaseUrl: env.SHOP_DATABASE_URL || "",
    supabaseUrl: env.SHOP_SUPABASE_URL || "",
    supabaseKey: env.SHOP_SUPABASE_KEY || "",
    supabaseServiceKey: env.SHOP_SUPABASE_SERVICE_ROLE_KEY || "",
    adminId: env.SHOP_ADMIN_USER_ID || "",
    workerSecret: env.SHOP_WORKER_SECRET || "",
    bankAccount: env.SHOP_MB_ACCOUNT || "",
    bankName: env.SHOP_MB_NAME || "",
    bankBin: "970422",
    r2Endpoint: env.SHOP_R2_ENDPOINT || "",
    r2Key: env.SHOP_R2_ACCESS_KEY || "",
    r2Secret: env.SHOP_R2_SECRET_KEY || "",
    productsBucket: env.SHOP_R2_PRODUCTS_BUCKET || "",
    previewsBucket: env.SHOP_R2_PREVIEWS_BUCKET || "",
    previewOrigin: env.SHOP_PREVIEW_ORIGIN || "",
    resendKey: env.SHOP_RESEND_KEY || "",
    emailFrom: env.SHOP_EMAIL_FROM || "",
    discordAdmin: env.SHOP_DISCORD_ADMIN || "",
    discordCommunity: env.SHOP_DISCORD_COMMUNITY || "",
  };
  if (!demo) {
    z.string().url().parse(config.origin);
    z.string().url().parse(config.supabaseUrl);
    z.string().min(20).parse(config.supabaseKey);
    z.string().uuid().parse(config.adminId);
    z.string().min(32).parse(config.workerSecret);
    if (!config.databaseUrl)
      throw new Error(
        "SHOP_DATABASE_URL must be set; legacy DATABASE_URL is never used by the store.",
      );
    if (
      config.productsBucket &&
      config.productsBucket === config.previewsBucket
    )
      throw new Error("Products and previews must use separate buckets.");
  }
  return config;
}
