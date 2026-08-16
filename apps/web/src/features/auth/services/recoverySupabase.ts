import {
  createClient,
} from "@supabase/supabase-js";


const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;


const supabasePublishableKey =
  import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY;


if (
  !supabaseUrl ||
  !supabasePublishableKey
) {
  throw new Error(
    "Thiếu cấu hình Supabase frontend",
  );
}


export const recoverySupabase =
  createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        /*
         * Chỉ giữ recovery session trong bộ nhớ.
         * Không lưu token vào localStorage.
         */
        persistSession: false,
        autoRefreshToken: false,


        /*
         * ResetPasswordForm sẽ tự đọc token
         * và gọi setSession().
         */
        detectSessionInUrl: false,
      },
    },
  );
