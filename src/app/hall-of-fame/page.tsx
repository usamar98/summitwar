import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Medal, Share2, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { getClosedSeasons } from "@/lib/data";
import { formatDuration, formatMoney, formatNumber } from "@/lib/format";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Weekly Startup Champions: Hall of Fame",
  description:
    "Explore every weekly SummitWar champion, winning project, final altitude, and runner-up preserved in the permanent startup leaderboard Hall of Fame.",
  path: "/hall-of-fame",
});

export default async function HallOfFamePage() {
  const seasons = await getClosedSeasons();
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="mb-12 text-center">
        <Badge className="bg-primary/10 text-primary">
          <Crown /> Weekly champions
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          Hall of Fame
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          The avalanche erases altitude, never history. Every weekly summit
          owner is archived here.
        </p>
      </div>
      {seasons.length ? (
        <div className="space-y-5">
          {seasons.map((season) => (
            <Card key={season.id} className="overflow-hidden border-primary/15">
              <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex gap-5">
                  <div className="hidden size-14 place-items-center rounded-2xl bg-primary/10 text-primary sm:grid">
                    <Medal className="size-6" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[.16em] text-primary">
                      Season {season.number} champion
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {season.winner ? (
                        <StartupMark
                          name={season.winner.name}
                          logoUrl={season.winner.logoUrl}
                        />
                      ) : null}
                      <div>
                        <h2 className="text-xl font-semibold">
                          {season.winner?.name ?? "No winner"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {new Date(season.startsAt).toLocaleDateString()} —{" "}
                          {new Date(season.endsAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span>
                        <strong className="text-foreground">
                          {formatNumber(season.winningAltitudeMeters)}m
                        </strong>{" "}
                        final altitude
                      </span>
                      <span>
                        <strong className="text-foreground">
                          {formatMoney(season.winningSpendCents)}
                        </strong>{" "}
                        season spend
                      </span>
                      <span>
                        <strong className="text-foreground">
                          ≈{formatNumber(season.winnerClicks)}
                        </strong>{" "}
                        clicks
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="size-3.5" />{" "}
                        {formatDuration(season.winnerSummitSeconds)} at summit
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Runner-up: {season.runnerUp?.name ?? "—"}
                    </p>
                  </div>
                </div>
                {season.winner ? (
                  <Button asChild variant="outline">
                    <Link href={`/og/champion/${season.winner.slug}`}>
                      <Share2 /> Champion card
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Crown className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">No completed seasons yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The first champion will appear after Sunday at 23:59:59 UTC.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
