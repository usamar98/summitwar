import { BadgeDollarSign, RotateCcw, ShieldCheck } from "lucide-react";
import { ActivityFeed } from "@/components/summitwar/activity-feed";
import { BaseCamp } from "@/components/summitwar/base-camp";
import { Countdown } from "@/components/summitwar/countdown";
import { InteractiveMountain } from "@/components/summitwar/mountain";
import { LiveProof } from "@/components/summitwar/live-proof";
import { MountainHeroPanel } from "@/components/summitwar/mountain-hero-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getHomeData } from "@/lib/data";

export default async function HomePage() {
  const data = await getHomeData();
  const summit = data.mountain[0] ?? null;
  return (
    <>
      <section
        id="mountain"
        className="site-grid relative scroll-mt-24 overflow-hidden border-b border-white/6"
      >
        <div className="aurora pointer-events-none absolute left-[8%] top-10 h-56 w-96 rotate-[-14deg] rounded-full bg-accent/20" />
        <div className="aurora pointer-events-none absolute right-[8%] top-0 h-64 w-80 rotate-12 rounded-full bg-primary/14" />
        <div className="relative mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 lg:px-10 lg:pb-16 lg:pt-14">
          <div className="mb-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Badge
                variant="outline"
                className="mb-4 border-primary/30 bg-primary/8 text-primary"
              >
                Top 50 · Season {data.season.number} is live
              </Badge>
              <h1 className="text-balance max-w-4xl text-4xl font-semibold leading-[.98] tracking-[-.05em] sm:text-5xl lg:text-6xl">
                Climb the internet&apos;s highest startup mountain.
              </h1>
              <p className="mt-4 max-w-2xl text-balance leading-7 text-muted-foreground">
                Every verified dollar adds 100 metres. Tap a flag to inspect a
                startup, or claim the first camp from the panel beside the
                mountain.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-accent" /> Verified
                  webhook payments
                </span>
                <span className="flex items-center gap-2">
                  <BadgeDollarSign className="size-4 text-accent" /> No
                  subscriptions
                </span>
                <span className="flex items-center gap-2">
                  <RotateCcw className="size-4 text-accent" /> Resets Mondays
                  00:00 UTC
                </span>
              </div>
            </div>
            <Card className="w-full border-primary/20 bg-black/20 backdrop-blur lg:w-[330px]">
              <CardContent className="p-5 sm:p-6">
                <div className="text-xs font-medium uppercase tracking-[.2em] text-primary">
                  Next avalanche
                </div>
                <div className="mt-3">
                  <Countdown end={data.season.endsAt} />
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-primary/15 pt-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Current summit
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {summit?.name ?? "Unclaimed"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Altitude
                    </div>
                    <div className="metric-number mt-1 font-mono text-lg font-semibold text-primary">
                      {summit
                        ? `${summit.altitudeMeters.toLocaleString()}m`
                        : "0m"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <InteractiveMountain initialStartups={data.mountain} />
            <MountainHeroPanel startup={summit} />
          </div>
          <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">Sponsored placement.</strong>{" "}
            Checkout never reserves a rank. A completed payment is applied only
            after Stripe&apos;s verified webhook and receives its actual live
            position.
          </div>
        </div>
      </section>
      <LiveProof stats={data.stats} season={data.season} demo={data.demo} />
      <div className="mx-auto max-w-[1440px] space-y-24 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
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
        <BaseCamp startups={data.baseCamp} />
      </div>
    </>
  );
}
