import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import {
  allowInMemoryRequest,
  isKnownBot,
  normalizePublicUrl,
  visitorFingerprint,
} from "@/lib/security";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!hasAdminSupabaseEnv())
    return Response.redirect(new URL("/", request.url));
  const supabase = createAdminClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id,normalized_url")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (!listing)
    return Response.json({ error: "Listing not found" }, { status: 404 });
  let destination: string;
  try {
    destination = normalizePublicUrl(listing.normalized_url);
  } catch {
    return Response.json({ error: "Unsafe destination" }, { status: 400 });
  }
  if (!isKnownBot(request.headers.get("user-agent"))) {
    const fingerprint = visitorFingerprint(request.headers, `click:${id}`);
    if (fingerprint && allowInMemoryRequest(`click:${fingerprint}`, 20, 60)) {
      const { data: allowed } = await supabase.rpc("consume_rate_limit", {
        p_key: `click:${fingerprint}`,
        p_limit: 15,
        p_window_seconds: 60,
      });
      if (allowed !== false)
        await supabase.rpc("record_outbound_click", {
          p_listing_id: id,
          p_visitor_hash: fingerprint,
        });
    }
  }
  return Response.redirect(destination, 302);
}
