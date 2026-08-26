import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { ActivityFeed } from "@/components/summitwar/activity-feed";
import { BaseCamp } from "@/components/summitwar/base-camp";
import { JsonLd } from "@/components/summitwar/json-ld";
import { InteractiveMountain } from "@/components/summitwar/mountain";
import { LiveProof } from "@/components/summitwar/live-proof";
import {
  MountainClimbers,
  SummitLeaders,
} from "@/components/summitwar/ranking-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Crown,
  Eye,
  MountainSnow,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { getHomeData } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { refreshListingMetadata } from "@/lib/listing-metadata";
import {
  HOME_TITLE,
  SITE_DESCRIPTION,
  buildHomeJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export const metadata: Metadata = createPageMetadata({
  title: HOME_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
  imageAlt: "SummitWar startup leaderboard on a virtual mountain",
});

export default async function HomePage() {
  const data = await getHomeData();
  const allProjects = [...data.mountain, ...data.baseCamp];
  const projectById = new Map(
    allProjects.map((project) => [project.id, project]),
  );
  const projectForLatestEvent = (
    eventTypes: Array<(typeof data.events)[number]["type"]>,
  ) => {
    const event = data.events.find(
      (item) => item.listingId && eventTypes.includes(item.type),
    );
    return event?.listingId ? projectById.get(event.listingId) : undefined;
  };
  const summitProject = data.mountain[0];
  const knockDownProject =
    projectForLatestEvent(["overtaken", "climbed"]) ??
    [...data.mountain.slice(1, 8)].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )[0];
  const reclaimProject = projectForLatestEvent(["summit_reclaimed"]);
  const staleMetadata = allProjects
    .filter(
      (startup) =>
        !startup.logoUrl ||
        startup.logoUrl.includes("/auto-") ||
        startup.logoUrl.includes("%2Fauto-"),
    )
    .slice(0, 2);
  if (!data.demo && staleMetadata.length) {
    after(async () => {
      const results = await Promise.allSettled(
        staleMetadata.map((startup) =>
          refreshListingMetadata({
            id: startup.id,
            website: startup.website,
            currentLogoUrl: startup.logoUrl,
          }),
        ),
      );
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("Project metadata refresh failed", result.reason);
        }
      }
    });
  }
  const jsonLd = buildHomeJsonLd(data.mountain);
  return (
    <>
      <JsonLd data={jsonLd} />
      <LiveProof stats={data.stats} demo={data.demo} />
      <section
        id="mountain"
        className="site-grid relative scroll-mt-24 overflow-hidden border-b border-white/6"
      >
        <div className="aurora pointer-events-none absolute left-[8%] top-10 h-56 w-96 rotate-[-14deg] rounded-full bg-accent/20" />
        <div className="aurora pointer-events-none absolute right-[8%] top-0 h-64 w-80 rotate-12 rounded-full bg-primary/14" />
        <div className="relative mx-auto max-w-[1600px] px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
          <div className="mx-auto mb-9 max-w-4xl text-center">
            <Badge
              variant="outline"
              className="mb-5 h-auto gap-2 rounded-full border-primary/25 bg-primary/7 px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-[.12em] text-muted-foreground"
            >
              <MountainSnow className="size-3.5 text-primary" />
              <span>
                {formatNumber(data.stats.startupsCompeting)} on the mountain
              </span>
              <span className="size-1 rounded-full bg-white/20" />
              <Eye className="size-3 text-accent" />
              <span>
                ≈{formatNumber(data.stats.uniqueVisitors)} visitors overall
              </span>
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[.98] tracking-[-.05em] sm:text-5xl lg:text-6xl">
              The live startup leaderboard for ambitious projects.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Discover rising startups and indie products, follow transparent
              weekly rankings, or plant your favicon and climb the mountain.
            </p>
            <div
              aria-label="Mountain takeover terms"
              className="mt-6 flex flex-wrap justify-center gap-2"
            >
              <Badge
                variant="outline"
                className="h-auto gap-1.5 rounded-full border-primary/30 bg-primary/8 px-3 py-1.5 text-[10px] text-primary"
              >
                <Crown className="size-3" /> Captured the Summit ·{" "}
                {summitProject?.name ?? "Summit open"}
              </Badge>
              <Badge
                variant="outline"
                className="h-auto gap-1.5 rounded-full border-white/12 bg-white/[.035] px-3 py-1.5 text-[10px] text-muted-foreground"
              >
                <TrendingDown className="size-3" /> Knocked Down ·{" "}
                {knockDownProject?.name ?? "Awaiting challenger"}
              </Badge>
              <Badge
                variant="outline"
                className="h-auto gap-1.5 rounded-full border-accent/30 bg-accent/8 px-3 py-1.5 text-[10px] text-accent"
              >
                <RotateCcw className="size-3" /> Reclaimed the Summit ·{" "}
                {reclaimProject?.name ?? "Awaiting return"}
              </Badge>
            </div>
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[236px_minmax(0,1fr)_340px]">
            <div className="order-3 xl:order-1">
              <MountainClimbers startups={data.mountain.slice(0, 8)} />
            </div>
            <div className="order-1 min-w-0 xl:order-2">
              <InteractiveMountain initialStartups={data.mountain} />
            </div>
            <div className="order-2 xl:order-3">
              <SummitLeaders startups={data.mountain.slice(0, 8)} />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">Sponsored placement.</strong>{" "}
            Checkout never reserves a rank. A completed payment is applied only
            after Stripe&apos;s verified webhook and receives its actual live
            position.
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] space-y-24 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <BaseCamp startups={allProjects} events={data.events} />
        <section className="grid gap-6 lg:grid-cols-[1fr_.78fr]">
          <ActivityFeed events={data.events} limit={7} />
          <Card className="overflow-hidden bg-gradient-to-br from-card to-accent/5">
            <CardContent className="flex h-full min-h-80 flex-col justify-between p-7 sm:p-9">
              <div>
                <Badge className="bg-accent/10 text-accent">
                  How climbing works
                </Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                  No votes. No reviews. No secret algorithm.
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Choose the next camp, take the summit, or set a whole-dollar
                  amount. We calculate the transparent minimum, Stripe handles
                  checkout, and only the verified webhook moves your flag.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border bg-background/30 p-4">
                  <div className="font-mono text-xl font-semibold text-primary">
                    $1
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    minimum
                  </div>
                </div>
                <div className="rounded-xl border bg-background/30 p-4">
                  <div className="font-mono text-xl font-semibold text-primary">
                    100m
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    per dollar
                  </div>
                </div>
                <div className="rounded-xl border bg-background/30 p-4">
                  <div className="font-mono text-xl font-semibold text-primary">
                    7d
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    per season
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        {data.testimonials.length ? (
          <section>
            <div className="mb-8">
              <Badge variant="outline" className="mb-3">
                Founder dispatches
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight">
                Heard from the mountain
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {data.testimonials.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <blockquote className="leading-7">
                      “{item.quote}”
                    </blockquote>
                    <p className="mt-5 text-sm text-muted-foreground">
                      {item.founderName} · {item.startupName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
        <section
          aria-labelledby="startup-discovery-title"
          className="rounded-2xl border border-white/8 bg-card/45 p-6 sm:p-8 lg:p-10"
        >
          <div className="max-w-3xl">
            <Badge variant="outline" className="border-accent/25 text-accent">
              Startup discovery platform
            </Badge>
            <h2
              id="startup-discovery-title"
              className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Discover projects through a leaderboard anyone can verify.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              SummitWar is a live startup leaderboard for founders, makers, and
              curious early adopters. It turns project discovery into a weekly
              mountain race: every approved project receives a public profile,
              every verified climb changes the ranking, and every position can
              be checked against the same published rules.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="bg-background/35">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">
                  Find rising startups and tools
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Browse the mountain to uncover new SaaS products, indie tools,
                  and founder-led projects. Each listing links to a dedicated
                  profile with its project description, category, website, and
                  public ranking history.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/35">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">
                  Follow transparent rankings
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  There are no votes, reviews, or hidden recommendation scores.
                  SummitWar labels every placement as sponsored, records
                  verified ranking events, and publishes the live statistics
                  behind each season.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/35">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">
                  Submit your project and climb
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Add a project with its name, website, X handle, and checkout
                  email. SummitWar fetches its favicon and page heading, creates
                  the profile, and places it according to the verified
                  whole-dollar climb.
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-7 max-w-4xl text-sm leading-7 text-muted-foreground">
            Rankings reset every Monday at 00:00 UTC, while permanent project
            profiles, lifetime history, and past champions remain available.
            Review the{" "}
            <Link className="text-accent hover:underline" href="/rules">
              transparent ranking rules
            </Link>
            , inspect the{" "}
            <Link className="text-accent hover:underline" href="/activity">
              verified activity ledger
            </Link>
            , compare{" "}
            <Link className="text-accent hover:underline" href="/stats">
              live startup statistics
            </Link>
            , or{" "}
            <Link className="text-primary hover:underline" href="/start">
              submit your startup to the leaderboard
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
