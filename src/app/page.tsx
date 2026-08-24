import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  BadgeDollarSign,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ActivityFeed } from "@/components/summitwar/activity-feed";
import { BaseCamp } from "@/components/summitwar/base-camp";
import { Countdown } from "@/components/summitwar/countdown";
import { InteractiveMountain } from "@/components/summitwar/mountain";
import { LiveProof } from "@/components/summitwar/live-proof";
import { SummitCard } from "@/components/summitwar/summit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHomeData } from "@/lib/data";

export default async function HomePage() {
  const data = await getHomeData();
  const summit = data.mountain[0] ?? null;
  return (
    <>
      <section className="site-grid relative overflow-hidden border-b border-white/6">
        <div className="aurora pointer-events-none absolute left-[8%] top-10 h-56 w-96 rotate-[-14deg] rounded-full bg-accent/20" />
        <div className="aurora pointer-events-none absolute right-[8%] top-0 h-64 w-80 rotate-12 rounded-full bg-primary/14" />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-4 pb-14 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:px-10 lg:pb-20">
          <div>
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 bg-primary/8 text-primary"
            >
              <Sparkles /> Season {data.season.number} is live
            </Badge>
            <h1 className="text-balance max-w-4xl text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-6xl lg:text-[82px]">
              Put your startup at the{" "}
              <span className="text-primary">highest point</span> on the
              internet.
            </h1>
            <p className="mt-7 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
              A weekly sponsored-ranking game for ambitious founders. Every $1
              adds 100 metres. The summit belongs to whoever climbs
              highest—until someone overtakes them.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-primary px-6 text-primary-foreground"
              >
                <Link href="/start">
                  Plant your flag <ArrowUpRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6">
                <Link href="#mountain">
                  See the mountain <ArrowDown />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" /> Verified webhook
                payments
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
          <Card className="border-primary/20 bg-black/20 backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <div className="text-xs font-medium uppercase tracking-[.2em] text-primary">
                Next avalanche
              </div>
              <div className="mt-3">
                <Countdown end={data.season.endsAt} />
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Season altitude returns to zero. Profiles, clicks, lifetime
                spend, wins, and achievements stay forever.
              </p>
              <div className="mt-6 h-px bg-gradient-to-r from-primary/40 to-transparent" />
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Current summit
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {summit?.name ?? "Unclaimed"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Altitude</div>
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
      </section>
      <LiveProof stats={data.stats} season={data.season} demo={data.demo} />
      <div className="mx-auto max-w-[1440px] space-y-24 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <section id="mountain" className="scroll-mt-24">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge
                variant="outline"
                className="mb-3 border-accent/25 text-accent"
              >
                Top 50 · live
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                The mountain
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Higher camps mean more verified current-season spend. Equal
                totals are ordered by who reached the amount first.
              </p>
            </div>
            <div className="max-w-sm rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
              <strong className="text-foreground">Sponsored placement.</strong>{" "}
              Checkout never reserves a rank. Your completed payment is applied
              after its verified webhook and receives its actual live position.
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <InteractiveMountain initialStartups={data.mountain} />
            <SummitCard startup={summit} />
          </div>
        </section>
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
                  amount. We calculate the transparent minimum, Dodo Payments
                  handles checkout, and only the verified webhook moves your
                  flag.
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
