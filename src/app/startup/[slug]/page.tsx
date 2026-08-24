import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Calendar,
  Crown,
  ExternalLink,
  Flag,
  MousePointerClick,
  Trophy,
} from "lucide-react";
import { RankHistoryChart } from "@/components/summitwar/charts";
import {
  ProfileTracker,
  ShareButton,
} from "@/components/summitwar/profile-actions";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getHomeData, getStartupBySlug } from "@/lib/data";
import { amountToOvertakeCents } from "@/lib/domain/ranking";
import { formatDuration, formatMoney, formatNumber } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);
  if (!startup) return { title: "Startup not found" };
  return {
    title: startup.name,
    description: startup.tagline,
    openGraph: {
      title: `${startup.name} is #${startup.currentRank ?? "Base Camp"} on SummitWar`,
      description: startup.tagline,
      images: [`/og/rank/${startup.slug}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/og/rank/${startup.slug}`],
    },
  };
}

export default async function StartupPage({ params }: Props) {
  const { slug } = await params;
  const [startup, home] = await Promise.all([
    getStartupBySlug(slug),
    getHomeData(),
  ]);
  if (!startup) notFound();
  const ordered = home.mountain;
  const index = ordered.findIndex((item) => item.id === startup.id);
  const target = index > 0 ? ordered[index - 1] : null;
  const climbCents = target
    ? amountToOvertakeCents(startup.seasonSpendCents, target.seasonSpendCents)
    : 100;
  const achievements = [
    startup.currentRank === 1 ? "Summit owner" : null,
    startup.currentRank && startup.currentRank <= 10 ? "Top ten" : null,
    startup.summitWins ? `${startup.summitWins}× champion` : null,
    startup.outboundClicks >= 500 ? "Traffic maker" : null,
  ].filter(Boolean) as string[];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-18">
      <ProfileTracker listingId={startup.id} />
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div className="flex gap-5">
          <StartupMark
            name={startup.name}
            logoUrl={startup.logoUrl}
            className="size-20 rounded-2xl text-xl"
          />
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">
                <Flag />{" "}
                {startup.currentRank
                  ? `Rank #${startup.currentRank}`
                  : "Base Camp"}
              </Badge>
              <Badge variant="outline">{startup.category}</Badge>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              {startup.name}
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
              {startup.tagline}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ShareButton title={startup.name} url={`/startup/${startup.slug}`} />
          <Button asChild>
            <Link
              href={`/checkout?listing=${startup.id}&amount=${climbCents / 100}`}
            >
              Climb for {formatMoney(climbCents)} <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line leading-7 text-muted-foreground">
                {startup.description}
              </p>
              <Separator className="my-6" />
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Founder</span>
                  <p className="mt-1 font-medium">
                    {startup.founderName} · {startup.founderHandle}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Launched</span>
                  <p className="mt-1 flex items-center gap-2 font-medium">
                    <Calendar className="size-4" /> {startup.launchYear}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Website</span>
                  <p className="mt-1">
                    <a
                      className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                      href={`/api/out/${startup.id}`}
                      rel="sponsored noopener"
                    >
                      {new URL(startup.website).hostname}
                      <ExternalLink className="size-3" />
                    </a>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Paid placement</span>
                  <p className="mt-1 font-medium">
                    Sponsored · normally non-refundable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rank history</CardTitle>
            </CardHeader>
            <CardContent>
              {startup.rankHistory.length ? (
                <RankHistoryChart data={startup.rankHistory} />
              ) : (
                <div className="grid h-52 place-items-center text-sm text-muted-foreground">
                  Rank snapshots appear after verified climbs.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Public payment history</CardTitle>
            </CardHeader>
            <CardContent>
              {startup.paymentHistory.length ? (
                <div className="divide-y">
                  {startup.paymentHistory.map((payment) => (
                    <div
                      className="flex items-center justify-between py-4 text-sm"
                      key={payment.id}
                    >
                      <div>
                        <p className="font-medium">Verified climb</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-mono text-primary">
                        {formatMoney(payment.amountCents)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No public payment records yet.
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Customer names, emails, card details, and provider metadata are
                never shown here.
              </p>
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-5">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-[.15em] text-primary">
                Current season
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Altitude</div>
                  <div className="metric-number mt-1 text-2xl font-semibold">
                    {formatNumber(startup.altitudeMeters)}m
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Spend</div>
                  <div className="metric-number mt-1 text-2xl font-semibold">
                    {formatMoney(startup.seasonSpendCents)}
                  </div>
                </div>
              </div>
              <Button asChild className="mt-6 h-11 w-full">
                <Link
                  href={`/checkout?listing=${startup.id}&amount=${climbCents / 100}`}
                >
                  Climb one position · {formatMoney(climbCents)}
                </Link>
              </Button>
              <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                Quote is live when rendered and does not reserve placement.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifetime signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lifetime spend</span>
                <strong>{formatMoney(startup.lifetimeSpendCents)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile views</span>
                <strong>≈{formatNumber(startup.profileViews)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified clicks</span>
                <strong>≈{formatNumber(startup.outboundClicks)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Summit wins</span>
                <strong>{startup.summitWins}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Summit time</span>
                <strong>{formatDuration(startup.totalSummitSeconds)}</strong>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length ? (
                <div className="flex flex-wrap gap-2">
                  {achievements.map((achievement) => (
                    <Badge key={achievement} variant="secondary">
                      {achievement.includes("champion") ? (
                        <Trophy />
                      ) : (
                        <Crown />
                      )}
                      {achievement}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The next climb can unlock the first badge.
                </p>
              )}
            </CardContent>
          </Card>
          <a
            href={`/api/out/${startup.id}`}
            rel="sponsored noopener"
            className="flex items-center justify-center gap-2 text-sm text-accent hover:underline"
          >
            <MousePointerClick className="size-4" /> Visit {startup.name}
          </a>
        </aside>
      </div>
    </div>
  );
}
