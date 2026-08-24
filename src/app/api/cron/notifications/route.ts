import { createHash } from "node:crypto";
import { sendTransactionalEmail } from "@/lib/email/send";
import { safeSecretMatch } from "@/lib/security";
import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (
    !safeSecretMatch(
      request.headers.get("authorization"),
      process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined,
    )
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminSupabaseEnv())
    return Response.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  const supabase = createAdminClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id,ends_at")
    .eq("status", "active")
    .maybeSingle();
  if (!season) return Response.json({ sent: 0 });
  const remaining = new Date(season.ends_at).getTime() - Date.now();
  if (remaining <= 0 || remaining > 24 * 3600_000)
    return Response.json({ sent: 0, reason: "outside-reminder-window" });
  const { data: contacts } = await supabase
    .from("listing_contacts")
    .select("listing_id,email,owner_id,listings!inner(name,status)");
  let sent = 0;
  for (const contact of contacts ?? []) {
    const listing = contact.listings as unknown as {
      name: string;
      status: string;
    };
    if (listing.status !== "approved") continue;
    if (contact.owner_id) {
      const { data: preference } = await supabase
        .from("notification_preferences")
        .select("upcoming_avalanche")
        .eq("owner_id", contact.owner_id)
        .maybeSingle();
      if (preference?.upcoming_avalanche === false) continue;
    }
    const digest = createHash("sha256")
      .update(contact.email.toLowerCase())
      .digest("hex");
    const { data: delivery } = await supabase
      .from("notification_deliveries")
      .upsert(
        {
          listing_id: contact.listing_id,
          season_id: season.id,
          template: "upcoming_avalanche",
          recipient_digest: digest,
        },
        {
          onConflict: "listing_id,season_id,template,recipient_digest",
          ignoreDuplicates: true,
        },
      )
      .select("id")
      .maybeSingle();
    if (!delivery) continue;
    await sendTransactionalEmail({
      to: contact.email,
      subject: "The SummitWar avalanche is coming",
      text: `${listing.name}'s seasonal altitude resets Monday at 00:00 UTC. The profile, lifetime spend, clicks, wins, and achievements remain.`,
    });
    sent++;
  }
  return Response.json({ sent });
}
