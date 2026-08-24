import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import { safeSecretMatch } from "@/lib/security";

export async function GET(request: Request) {
  if (
    !safeSecretMatch(
      request.headers.get("authorization"),
      process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined,
    )
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminSupabaseEnv())
    return Response.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("rotate_weekly_season", {
    p_now: new Date().toISOString(),
  });
  if (error)
    return Response.json({ error: "Season rotation failed" }, { status: 500 });
  return Response.json({ ok: true, result: data });
}
