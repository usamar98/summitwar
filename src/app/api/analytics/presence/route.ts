import { isKnownBot, visitorFingerprint } from "@/lib/security";
import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (isKnownBot(request.headers.get("user-agent")) || !hasAdminSupabaseEnv())
    return Response.json({ online: 0 });
  const fingerprint = visitorFingerprint(request.headers, "presence");
  if (!fingerprint) return Response.json({ online: 0 });
  const supabase = createAdminClient();
  const { data: allowed } = await supabase.rpc("consume_rate_limit", {
    p_key: `presence:${fingerprint}`,
    p_limit: 4,
    p_window_seconds: 60,
  });
  if (allowed === false)
    return Response.json({ error: "Rate limited" }, { status: 429 });
  const { data, error } = await supabase.rpc("heartbeat_presence", {
    p_visitor_hash: fingerprint,
  });
  if (error) return Response.json({ online: 0 });
  return Response.json({ online: Number(data ?? 0) });
}
