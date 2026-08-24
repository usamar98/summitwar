import "server-only";

import { cache } from "react";
import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import { demoHomeData, demoSeason, demoStartups } from "@/lib/demo-data";
import { getSeasonBounds } from "@/lib/format";
import type {
  HomeData,
  RankingEvent,
  Season,
  SiteStats,
  Startup,
} from "@/lib/types";

type DbListing = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  logo_url: string | null;
  founder_name: string;
  founder_x_handle: string;
  category: string;
  launch_year: number;
  current_rank: number | null;
  current_season_spend_cents: number;
  lifetime_spend_cents: number;
  lifetime_profile_views: number;
  total_outbound_clicks: number;
  summit_wins: number;
  total_summit_seconds: number;
  first_reached_current_spend_at: string;
  created_at: string;
  is_demo: boolean;
};

function isDemoMode() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}

export function mapListing(row: DbListing): Startup {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    website: row.website_url,
    logoUrl: row.logo_url,
    founderName: row.founder_name,
    founderHandle: row.founder_x_handle,
    category: row.category,
    launchYear: row.launch_year,
    currentRank: row.current_rank,
    seasonSpendCents: row.current_season_spend_cents,
    lifetimeSpendCents: row.lifetime_spend_cents,
    altitudeMeters: row.current_season_spend_cents,
    profileViews: row.lifetime_profile_views,
    outboundClicks: row.total_outbound_clicks,
    summitWins: row.summit_wins,
    totalSummitSeconds: row.total_summit_seconds,
    firstReachedAt: row.first_reached_current_spend_at,
    createdAt: row.created_at,
    rankHistory: [],
    paymentHistory: [],
  };
}

function emptyStats(): SiteStats {
  return {
    verifiedRevenueCents: 0,
    revenueTodayCents: 0,
    revenueSeasonCents: 0,
    paymentCount: 0,
    averagePaymentCents: 0,
    largestPaymentCents: 0,
    paidStartups: 0,
    onlineVisitors: 0,
    uniqueVisitors: 0,
    profileViews: 0,
    outboundClicks: 0,
    ctr: 0,
    totalClimbs: 0,
    startupsCompeting: 0,
    daily: [],
  };
}

function emptySeason(): Season {
  const { startsAt, endsAt } = getSeasonBounds();
  return {
    id: "unconfigured",
    number: 1,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: "active",
    winner: null,
    runnerUp: null,
    winningSpendCents: 0,
    winningAltitudeMeters: 0,
    winnerClicks: 0,
    winnerSummitSeconds: 0,
  };
}

function toStats(
  row: Record<string, unknown> | null,
  daily: HomeData["stats"]["daily"],
): SiteStats {
  const number = (key: string) => Number(row?.[key] ?? 0);
  const views = number("profile_views");
  const clicks = number("outbound_clicks");
  return {
    verifiedRevenueCents: number("verified_revenue_cents"),
    revenueTodayCents: number("revenue_today_cents"),
    revenueSeasonCents: number("revenue_season_cents"),
    paymentCount: number("payment_count"),
    averagePaymentCents: number("average_payment_cents"),
    largestPaymentCents: number("largest_payment_cents"),
    paidStartups: number("paid_startups"),
    onlineVisitors: number("online_visitors"),
    uniqueVisitors: number("unique_visitors"),
    profileViews: views,
    outboundClicks: clicks,
    ctr: views ? Number(((clicks / views) * 100).toFixed(1)) : 0,
    totalClimbs: number("total_climbs"),
    startupsCompeting: number("startups_competing"),
    daily,
  };
}

export const getHomeData = cache(async (): Promise<HomeData> => {
  if (isDemoMode()) return demoHomeData;
  if (!hasAdminSupabaseEnv()) {
    return {
      demo: false,
      season: emptySeason(),
      mountain: [],
      baseCamp: [],
      events: [],
      stats: emptyStats(),
      testimonials: [],
    };
  }

  const supabase = createAdminClient();
  const [
    listingsResult,
    seasonResult,
    eventsResult,
    metricsResult,
    statsResult,
    testimonialsResult,
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("status", "approved")
      .order("current_rank", { ascending: true, nullsFirst: false }),
    supabase.from("seasons").select("*").eq("status", "active").maybeSingle(),
    supabase
      .from("ranking_events")
      .select("id,event_type,message,listing_id,created_at")
      .order("created_at", { ascending: false })
      .limit(16),
    supabase
      .from("daily_metrics")
      .select("metric_date,revenue_cents,climbs,outbound_clicks")
      .order("metric_date", { ascending: true })
      .limit(30),
    supabase.rpc("get_public_site_stats").maybeSingle(),
    supabase
      .from("testimonials")
      .select("id,quote,founder_name,startup_name")
      .eq("is_published", true)
      .order("sort_order")
      .limit(8),
  ]);

  const listingRows = (listingsResult.data ?? []) as DbListing[];
  const listings = listingRows.map(mapListing);
  const seasonRow = seasonResult.data as Record<string, unknown> | null;
  const season: Season = seasonRow
    ? {
        id: String(seasonRow.id),
        number: Number(seasonRow.season_number),
        startsAt: String(seasonRow.starts_at),
        endsAt: String(seasonRow.ends_at),
        status: "active",
        winner: null,
        runnerUp: null,
        winningSpendCents: 0,
        winningAltitudeMeters: 0,
        winnerClicks: 0,
        winnerSummitSeconds: 0,
      }
    : emptySeason();
  const daily = (
    (metricsResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
    date: String(row.metric_date),
    revenueCents: Number(row.revenue_cents),
    climbs: Number(row.climbs),
    clicks: Number(row.outbound_clicks),
  }));
  const events: RankingEvent[] = (
    (eventsResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    type: row.event_type as RankingEvent["type"],
    message: String(row.message),
    listingId: row.listing_id ? String(row.listing_id) : null,
    createdAt: String(row.created_at),
  }));
  const testimonials = (
    (testimonialsResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    quote: String(row.quote),
    founderName: String(row.founder_name),
    startupName: String(row.startup_name),
  }));

  return {
    demo: listingRows.some((row) => row.is_demo),
    season,
    mountain: listings.filter(
      (item) => item.currentRank && item.currentRank <= 50,
    ),
    baseCamp: listings.filter(
      (item) => !item.currentRank || item.currentRank > 50,
    ),
    events,
    stats: toStats(
      (statsResult.data ?? null) as Record<string, unknown> | null,
      daily,
    ),
    testimonials,
  };
});

export const getStartupBySlug = cache(
  async (slug: string): Promise<Startup | null> => {
    if (isDemoMode())
      return demoStartups.find((item) => item.slug === slug) ?? null;
    if (!hasAdminSupabaseEnv()) return null;
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    if (!data) return null;
    const startup = mapListing(data as DbListing);
    const [history, payments] = await Promise.all([
      supabase
        .from("rank_snapshots")
        .select("rank,altitude_meters,captured_at")
        .eq("listing_id", startup.id)
        .order("captured_at")
        .limit(180),
      supabase
        .from("payments")
        .select("id,amount_cents,completed_at")
        .eq("listing_id", startup.id)
        .eq("status", "succeeded")
        .order("completed_at", { ascending: false })
        .limit(30),
    ]);
    startup.rankHistory = (
      (history.data ?? []) as Array<Record<string, unknown>>
    ).map((row) => ({
      at: String(row.captured_at),
      rank: Number(row.rank),
      altitudeMeters: Number(row.altitude_meters),
    }));
    startup.paymentHistory = (
      (payments.data ?? []) as Array<Record<string, unknown>>
    ).map((row) => ({
      id: String(row.id),
      amountCents: Number(row.amount_cents),
      createdAt: String(row.completed_at),
    }));
    return startup;
  },
);

export const getClosedSeasons = cache(async (): Promise<Season[]> => {
  if (isDemoMode()) {
    return Array.from({ length: 5 }, (_, index) => ({
      ...demoSeason,
      id: `demo-hall-${index}`,
      number: 11 - index,
      status: "closed" as const,
      startsAt: new Date(
        Date.now() - (index + 1) * 7 * 86400_000,
      ).toISOString(),
      endsAt: new Date(Date.now() - index * 7 * 86400_000 - 1).toISOString(),
      winner: demoStartups[index],
      runnerUp: demoStartups[index + 1],
      winningSpendCents: demoStartups[index].seasonSpendCents,
      winningAltitudeMeters: demoStartups[index].altitudeMeters,
      winnerClicks: demoStartups[index].outboundClicks,
      winnerSummitSeconds: demoStartups[index].totalSummitSeconds,
    }));
  }
  if (!hasAdminSupabaseEnv()) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seasons")
    .select(
      "*,winner:listings!seasons_winner_listing_id_fkey(*),runner_up:listings!seasons_runner_up_listing_id_fkey(*)",
    )
    .eq("status", "closed")
    .order("ends_at", { ascending: false });
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    number: Number(row.season_number),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    status: "closed",
    winner: row.winner ? mapListing(row.winner as DbListing) : null,
    runnerUp: row.runner_up ? mapListing(row.runner_up as DbListing) : null,
    winningSpendCents: Number(row.winning_spend_cents ?? 0),
    winningAltitudeMeters: Number(row.winning_altitude_meters ?? 0),
    winnerClicks: Number(row.winner_clicks ?? 0),
    winnerSummitSeconds: Number(row.winner_summit_seconds ?? 0),
  }));
});
