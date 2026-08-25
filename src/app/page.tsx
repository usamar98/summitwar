import { ActivityFeed } from "@/components/summitwar/activity-feed";
import { BaseCamp } from "@/components/summitwar/base-camp";
import { InteractiveMountain } from "@/components/summitwar/mountain";
import { LiveProof } from "@/components/summitwar/live-proof";
import {
  MountainClimbers,
  SummitLeaders,
} from "@/components/summitwar/ranking-panels";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, MountainSnow } from "lucide-react";
import { getHomeData } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();
  return (
    <>
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
              The highest point on the internet for ambitious projects.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Plant your logo, climb the live leaderboard, and turn every metre
              into a moment your next visitor remembers.
            </p>
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-[236px_minmax(0,1fr)_286px]">
            <div className="order-3 xl:order-1">
              <MountainClimbers startups={data.mountain.slice(8)} />
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
