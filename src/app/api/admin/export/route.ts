import { getVerifiedUser, isAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    keys.map(escape).join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ].join("\n");
}
export async function GET(request: Request) {
  const user = await getVerifiedUser();
  if (!user || !isAdminEmail(user.email))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const kind = new URL(request.url).searchParams.get("kind") ?? "listings";
  const supabase = createAdminClient();
  let rows: Array<Record<string, unknown>> = [];
  if (kind === "payments") {
    const { data } = await supabase
      .from("payments")
      .select(
        "id,listing_id,provider,status,amount_cents,currency,verified,completed_at,created_at",
      )
      .order("created_at", { ascending: false });
    rows = data ?? [];
  } else if (kind === "analytics") {
    const { data } = await supabase
      .from("daily_metrics")
      .select("*")
      .order("metric_date", { ascending: false });
    rows = data ?? [];
  } else {
    const { data } = await supabase
      .from("listings")
      .select(
        "id,slug,name,category,status,current_rank,current_season_spend_cents,lifetime_spend_cents,lifetime_profile_views,total_outbound_clicks,created_at",
      )
      .order("created_at", { ascending: false });
    rows = data ?? [];
  }
  return new Response(csv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="summitwar-${kind}.csv"`,
      "cache-control": "no-store",
    },
  });
}
