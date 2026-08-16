import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, "");

const serverAuthOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

export function createSupabaseClient() {
  return createClient(
    supabaseUrl,
    env.SUPABASE_PUBLISHABLE_KEY,
    serverAuthOptions,
  );
}

export function createSupabaseAdminClient() {
  return createClient(
    supabaseUrl,
    env.SUPABASE_SECRET_KEY,
    serverAuthOptions,
  );
}

export function createSupabaseUserClient(
  accessToken: string,
) {
  return createClient(
    supabaseUrl,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      ...serverAuthOptions,

      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}