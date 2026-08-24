import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUp,
  Bell,
  ChartNoAxesCombined,
  Crown,
  Eye,
  MousePointerClick,
  Save,
  Share2,
  Trophy,
} from "lucide-react";
import { ExistingClimbForm } from "@/components/summitwar/climb-form";
import {
  OwnerActivityChart,
  RankHistoryChart,
} from "@/components/summitwar/charts";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { mapListing } from "@/lib/data";
import { amountToOvertakeCents } from "@/lib/domain/ranking";
import {
  formatDuration,
  formatMoney,
  formatNumber,
  isoDaysAgo,
} from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateListingAction, updateNotificationsAction } from "./actions";

export const metadata: Metadata = {
  title: "Owner dashboard",
  robots: { index: false, follow: false },
};

function dailySeries(
  views: Array<{ occurred_at: string }>,
  clicks: Array<{ occurred_at: string }>,
) {
  const map = new Map<
    string,
    { date: string; views: number; clicks: number }
  >();
  for (let offset = 13; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 86400_000)
      .toISOString()
      .slice(0, 10);
    map.set(date, { date, views: 0, clicks: 0 });
  }
  views.forEach((event) => {
    const item = map.get(event.occurred_at.slice(0, 10));
    if (item) item.views++;
  });
  clicks.forEach((event) => {
    const item = map.get(event.occurred_at.slice(0, 10));
    if (item) item.clicks++;
  });
  return [...map.values()];
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createAdminClient();
  const { data: paid } = await supabase
    .from("payments")
    .select("listing_id")
    .eq("payer_email", user.email.toLowerCase())
    .eq("status", "succeeded");
  if (paid?.length) {
    const claimedIds = [...new Set(paid.map((item) => item.listing_id))];
    await supabase.from("listing_owners").upsert(
      claimedIds.map((listingId) => ({
        listing_id: listingId,
        owner_id: user.id,
      })),
      { onConflict: "listing_id,owner_id", ignoreDuplicates: true },
    );
    await supabase
      .from("listing_contacts")
      .update({ owner_id: user.id })
      .in("listing_id", claimedIds)
      .eq("email", user.email.toLowerCase());
  }
  const { data: ownerships } = await supabase
    .from("listing_owners")
    .select("listing_id")
    .eq("owner_id", user.id);
  const ids = ownerships?.map((item) => item.listing_id) ?? [];
  const { data: listingRows } = ids.length
    ? await supabase
        .from("listings")
        .select("*")
        .in("id", ids)
        .order("lifetime_spend_cents", { ascending: false })
    : { data: [] };
  const listing = listingRows?.[0]
    ? mapListing(listingRows[0] as Parameters<typeof mapListing>[0])
    : null;
  if (!listing)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <Alert>
          <Trophy />
          <AlertTitle>No claimed startup yet</AlertTitle>
          <AlertDescription>
            Use the email from a successful checkout. Ownership is linked only
            after the verified payment webhook has completed.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/start">Create a listing</Link>
        </Button>
      </div>
    );

  const [snapshots, views, clicks, holds, prefs, ranked] = await Promise.all([
    supabase
      .from("rank_snapshots")
      .select("rank,altitude_meters,captured_at")
      .eq("listing_id", listing.id)
      .order("captured_at")
      .limit(180),
    supabase
      .from("profile_view_events")
      .select("occurred_at")
      .eq("listing_id", listing.id)
      .gte("occurred_at", isoDaysAgo(14)),
    supabase
      .from("outbound_click_events")
      .select("occurred_at")
      .eq("listing_id", listing.id)
      .gte("occurred_at", isoDaysAgo(14)),
    supabase
      .from("summit_holds")
      .select("started_at,ended_at,seconds_held")
      .eq("listing_id", listing.id)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("id,name,slug,current_rank,current_season_spend_cents")
      .eq("status", "approved")
      .order("current_rank"),
  ]);
  listing.rankHistory = (snapshots.data ?? []).map((row) => ({
    at: row.captured_at,
    rank: row.rank,
    altitudeMeters: row.altitude_meters,
  }));
  const above =
    listing.currentRank && listing.currentRank > 1
      ? ranked.data?.find(
          (item) => item.current_rank === listing.currentRank! - 1,
        )
      : null;
  const below = listing.currentRank
    ? ranked.data?.find(
        (item) => item.current_rank === listing.currentRank! + 1,
      )
    : null;
  const summit = ranked.data?.[0];
  const nextCents = above
    ? amountToOvertakeCents(
        listing.seasonSpendCents,
        Number(above.current_season_spend_cents),
      )
    : 100;
  const summitCents =
    summit && summit.id !== listing.id
      ? amountToOvertakeCents(
          listing.seasonSpendCents,
          Number(summit.current_season_spend_cents),
        )
      : 100;
  const ctr = listing.profileViews
    ? (listing.outboundClicks / listing.profileViews) * 100
    : 0;
  const activity = dailySeries(views.data ?? [], clicks.data ?? []);
  const preference = prefs.data ?? {
    successful_climb: true,
    overtaken: true,
    summit_reached: true,
    upcoming_avalanche: true,
    season_victory: true,
  };
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <StartupMark
            name={listing.name}
            logoUrl={listing.logoUrl}
            className="size-14"
          />
          <div>
            <Badge className="bg-primary/10 text-primary">
              Owner dashboard
            </Badge>
            <h1 className="mt-2 text-2xl font-semibold">{listing.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={`/og/rank/${listing.slug}`} download>
              <ArrowDownToLine /> X card
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={`/api/share/${listing.slug}`}>
              <Share2 /> Share on X
            </a>
          </Button>
          <Button asChild>
            <Link href={`/startup/${listing.slug}`}>Public profile</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {(
          [
            [
              Crown,
              "Rank",
              listing.currentRank ? `#${listing.currentRank}` : "Base",
            ],
            [ArrowUp, "Altitude", `${formatNumber(listing.altitudeMeters)}m`],
            [
              ChartNoAxesCombined,
              "Season spend",
              formatMoney(listing.seasonSpendCents),
            ],
            [Trophy, "Lifetime spend", formatMoney(listing.lifetimeSpendCents)],
            [Eye, "Profile views", `≈${formatNumber(listing.profileViews)}`],
            [
              MousePointerClick,
              "Unique clicks",
              `≈${formatNumber(listing.outboundClicks)}`,
            ],
            [ChartNoAxesCombined, "CTR", `${ctr.toFixed(1)}%`],
          ] as const
        ).map(([Icon, label, value]) => (
          <Card key={String(label)}>
            <CardContent className="p-4">
              <Icon className="size-4 text-accent" />
              <div className="metric-number mt-3 text-lg font-semibold">
                {value}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="overview" className="mt-7">
        <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="climb">Top up</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-5 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Views and clicks · 14 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OwnerActivityChart data={activity} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rank history</CardTitle>
              </CardHeader>
              <CardContent>
                {listing.rankHistory.length ? (
                  <RankHistoryChart data={listing.rankHistory} />
                ) : (
                  <div className="grid h-64 place-items-center text-sm text-muted-foreground">
                    No rank snapshots yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nearest competitors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Immediately above
                  </span>
                  <strong>
                    {above
                      ? `#${above.current_rank} ${above.name}`
                      : "The summit is yours"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Immediately below
                  </span>
                  <strong>
                    {below
                      ? `#${below.current_rank} ${below.name}`
                      : "No challenger yet"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Next position minimum
                  </span>
                  <strong className="text-primary">
                    {formatMoney(nextCents)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summit minimum</span>
                  <strong className="text-primary">
                    {formatMoney(summitCents)}
                  </strong>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Summit ownership history
                </CardTitle>
              </CardHeader>
              <CardContent>
                {holds.data?.length ? (
                  <div className="space-y-3">
                    {holds.data.map((hold, index) => (
                      <div
                        key={`${hold.started_at}-${index}`}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {new Date(hold.started_at).toLocaleString()}
                        </span>
                        <strong>
                          {hold.ended_at
                            ? formatDuration(Number(hold.seconds_held))
                            : "Holding now"}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Capture the summit to start this history.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="climb" className="mt-5 mx-auto max-w-2xl">
          <ExistingClimbForm
            listingId={listing.id}
            startupName={listing.name}
            nextCents={nextCents}
            summitCents={summitCents}
            initialDollars={nextCents / 100}
          />
        </TabsContent>
        <TabsContent value="profile" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Edit public profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateListingAction} className="grid gap-5">
                <input type="hidden" name="listingId" value={listing.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={listing.name}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="founderHandle">X handle</Label>
                    <Input
                      id="founderHandle"
                      name="founderHandle"
                      defaultValue={listing.founderHandle}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={listing.category}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="logo">Logo</Label>
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    defaultValue={listing.tagline}
                    maxLength={160}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={listing.description}
                    rows={7}
                    maxLength={5000}
                    required
                  />
                </div>
                <Button type="submit" className="w-fit">
                  <Save /> Save profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5" /> Email notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateNotificationsAction} className="space-y-4">
                {[
                  [
                    "successfulClimb",
                    "Successful listing and climbs",
                    preference.successful_climb,
                  ],
                  ["overtaken", "When we are overtaken", preference.overtaken],
                  [
                    "summitReached",
                    "When we reach the summit",
                    preference.summit_reached,
                  ],
                  [
                    "upcomingAvalanche",
                    "Upcoming avalanche reminder",
                    preference.upcoming_avalanche,
                  ],
                  [
                    "seasonVictory",
                    "Season victory",
                    preference.season_victory,
                  ],
                ].map(([name, label, checked]) => (
                  <label
                    key={String(name)}
                    className="flex items-center justify-between rounded-xl border p-4 text-sm"
                  >
                    <span>{String(label)}</span>
                    <input
                      className="size-4 accent-[var(--primary)]"
                      type="checkbox"
                      name={String(name)}
                      defaultChecked={Boolean(checked)}
                    />
                  </label>
                ))}
                <Button type="submit">
                  <Save /> Save preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
