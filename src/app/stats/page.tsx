import type { Metadata } from "next";
import {
  Activity,
  CircleDollarSign,
  Eye,
  MousePointerClick,
  ReceiptText,
  Radio,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { MetricsChart } from "@/components/summitwar/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHomeData } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Live Startup Leaderboard Statistics",
  description:
    "Explore live SummitWar statistics for verified startup climbs, sponsored revenue, project categories, visitors, profile views, and outbound clicks.",
  path: "/stats",
});

export default async function StatsPage() {
  const { stats, mountain, demo } = await getHomeData();
  const cards = [
    [
      CircleDollarSign,
      "Verified transaction revenue",
      formatMoney(stats.verifiedRevenueCents),
    ],
    [TrendingUp, "Revenue today", formatMoney(stats.revenueTodayCents)],
    [Rocket, "Revenue this season", formatMoney(stats.revenueSeasonCents)],
    [ReceiptText, "Successful payments", formatNumber(stats.paymentCount)],
    [Activity, "Average payment", formatMoney(stats.averagePaymentCents)],
    [
      CircleDollarSign,
      "Largest payment",
      formatMoney(stats.largestPaymentCents),
    ],
    [Radio, "Online visitors", formatNumber(stats.onlineVisitors)],
    [Eye, "Approx. profile views", formatNumber(stats.profileViews)],
    [
      MousePointerClick,
      "Verified outbound clicks",
      formatNumber(stats.outboundClicks),
    ],
  ] as const;
  const categories = Object.entries(
    mountain.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.seasonSpendCents;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-accent/25 text-accent">
            Live ledger
          </Badge>
          {demo ? (
            <Badge className="bg-primary/10 text-primary">Demo data</Badge>
          ) : null}
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          The mountain, in numbers.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          This is verified one-time transaction revenue, not subscription MRR.
          Visitor and click counts are privacy-conscious approximations.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([Icon, label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="metric-number mt-2 text-2xl font-semibold">
                    {value}
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-accent">
                  <Icon className="size-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by day</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart data={stats.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Climbs by day</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart data={stats.daily} metric="climbs" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks by day</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart data={stats.daily} metric="clicks" />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Most competitive categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.length ? (
              categories.map(([name, cents], index) => (
                <div
                  key={name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="mr-3 font-mono text-muted-foreground">
                      0{index + 1}
                    </span>
                    {name}
                  </span>
                  <span className="font-mono text-primary">
                    {formatMoney(cents)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No category activity yet.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biggest climbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mountain.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  #{item.currentRank} {item.name}
                </span>
                <span className="font-mono text-primary">
                  {formatNumber(item.altitudeMeters)}m
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most-clicked startups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...mountain]
              .sort((a, b) => b.outboundClicks - a.outboundClicks)
              .slice(0, 6)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.name}</span>
                  <span className="font-mono text-accent">
                    ≈{formatNumber(item.outboundClicks)}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 border-dashed">
        <CardContent className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">Previous-season comparison</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comparison appears after the first completed production season has
              a finalized daily rollup.
            </p>
          </div>
          <Badge variant="outline">Awaiting comparable period</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
