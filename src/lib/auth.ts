import "server-only";

import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/domain/authorization";

export { isAdminEmail };

export async function getVerifiedUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    id: String(data.claims.sub),
    email: String(data.claims.email ?? ""),
  };
}

export async function requireUser() {
  const user = await getVerifiedUser();
  if (!user) redirect("/login?next=/dashboard");
  return user;
}

export async function requireAdmin() {
  const user = await getVerifiedUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) redirect("/");
  return user;
}
