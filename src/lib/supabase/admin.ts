import "server-only";

import { createClient } from "@supabase/supabase-js";

export function hasAdminSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}

export function createAdminClient() {
  if (!hasAdminSupabaseEnv())
    throw new Error("Supabase secret environment is not configured");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
