import { z } from "zod";
import {
  allowInMemoryRequest,
  isKnownBot,
  visitorFingerprint,
} from "@/lib/security";
import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";

const schema = z.object({ listingId: z.string().uuid() });

export async function POST(request: Request) {
  if (isKnownBot(request.headers.get("user-agent")))
    return Response.json({ recorded: false });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "Invalid listing" }, { status: 400 });
  const fingerprint = visitorFingerprint(
    request.headers,
    `view:${parsed.data.listingId}`,
  );
  if (!fingerprint) return Response.json({ recorded: false });
  if (!hasAdminSupabaseEnv())
    return Response.json({ recorded: false, demo: true });
  const supabase = createAdminClient();
  const { data: allowed } = await supabase.rpc("consume_rate_limit", {
    p_key: `view:${fingerprint}`,
    p_limit: 30,
    p_window_seconds: 60,
  });
  if (allowed === false || !allowInMemoryRequest(`view:${fingerprint}`, 40, 60))
    return Response.json({ error: "Rate limited" }, { status: 429 });
  const { data } = await supabase.rpc("record_profile_view", {
    p_listing_id: parsed.data.listingId,
    p_visitor_hash: fingerprint,
  });
  return Response.json({ recorded: Boolean(data) });
}
