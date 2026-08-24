import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import { safeSecretMatch } from "@/lib/security";
import { sendTransactionalEmail } from "@/lib/email/send";

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
  const result = data as {
    rotated?: boolean;
    winner_listing_id?: string;
  } | null;
  if (result?.rotated && result.winner_listing_id) {
    const { data: contacts } = await supabase
      .from("listing_contacts")
      .select("email,owner_id")
      .eq("listing_id", result.winner_listing_id);
    for (const contact of contacts ?? []) {
      let enabled = true;
      if (contact.owner_id) {
        const { data: preference } = await supabase
          .from("notification_preferences")
          .select("season_victory")
          .eq("owner_id", contact.owner_id)
          .maybeSingle();
        enabled = preference?.season_victory ?? true;
      }
      if (enabled)
        await sendTransactionalEmail({
          to: contact.email,
          subject: "You won the SummitWar season",
          text: "The avalanche is complete. Your startup has been permanently added to the Hall of Fame as weekly champion.",
        });
    }
  }
  return Response.json({ ok: true, result: data });
}
