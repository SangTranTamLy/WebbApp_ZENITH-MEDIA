import { createClient } from "@supabase/supabase-js";
export const isDemo = import.meta.env.VITE_DEMO === "true";
const url = import.meta.env.VITE_SHOP_SUPABASE_URL,
  key = import.meta.env.VITE_SHOP_SUPABASE_KEY;
export const supabase =
  !isDemo && url && key
    ? createClient(url, key, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
