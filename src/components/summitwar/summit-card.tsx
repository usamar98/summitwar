import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Crown,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { formatDuration, formatMoney, formatNumber } from "@/lib/format";
import type { Startup } from "@/lib/types";

export function SummitCard({ startup }: { startup: Startup | null }) {
  if (!startup)
    return (
      <Card className="border-dashed border-primary/25 bg-primary/5">
        <CardHeader>
          <Badge className="w-fit bg-primary/10 text-primary">
            Summit unclaimed
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">
            Your flag could be first.
          </h2>
          <p className="text-muted-foreground">
            The active season has no verified climb yet. One dollar starts at
            100 metres.
          </p>
        </CardHeader>
        <CardFooter>
          <Button asChild size="lg">
            <Link href="/start">
              Claim the first camp <ArrowUpRight />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  return (
    <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-b from-primary/10 to-card shadow-[0_28px_80px_-45px_rgba(255,205,95,.55)]">
      <div className="absolute right-0 top-0 size-48 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/10 blur-3xl" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge className="bg-primary text-primary-foreground">
            <Crown /> Current summit owner
          </Badge>
          <span className="font-mono text-xs text-primary">8,000m+ club</span>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <StartupMark
            name={startup.name}
            logoUrl={startup.logoUrl}
            className="size-16 text-lg ring-2 ring-primary/50"
          />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {startup.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {startup.tagline}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border">
          <div className="bg-card p-4">
            <div className="text-xs text-muted-foreground">
              Current-season amount
            </div>
            <div className="metric-number mt-1 text-xl font-semibold">
              {formatMoney(startup.seasonSpendCents)}
            </div>
          </div>
          <div className="bg-card p-4">
            <div className="text-xs text-muted-foreground">Altitude</div>
            <div className="metric-number mt-1 text-xl font-semibold text-primary">
              {formatNumber(startup.altitudeMeters)}m
            </div>
          </div>
          <div className="bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="size-3" /> Time at summit
            </div>
            <div className="mt-1 font-semibold">
              {formatDuration(startup.totalSummitSeconds)}
            </div>
          </div>
          <div className="bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Eye className="size-3" /> Profile views
            </div>
            <div className="mt-1 font-semibold">
              ≈{formatNumber(startup.profileViews)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div>
            <div className="text-xs text-muted-foreground">
              Exact minimum to take summit now
            </div>
            <div className="metric-number mt-1 text-2xl font-semibold">
              {formatMoney(startup.seasonSpendCents + 100)}
            </div>
          </div>
          <MousePointerClick className="size-6 text-accent" />
        </div>
      </CardContent>
      <CardFooter className="grid gap-3">
        <Button
          asChild
          size="lg"
          className="h-11 w-full bg-primary text-primary-foreground"
        >
          <Link
            href={`/checkout?listing=${startup.id}&amount=${startup.seasonSpendCents / 100 + 1}`}
          >
            Take the Summit <ArrowUpRight />
          </Link>
        </Button>
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <span>{startup.founderHandle}</span>
          <span>{startup.category}</span>
          <span>≈{formatNumber(startup.outboundClicks)} clicks</span>
        </div>
      </CardFooter>
    </Card>
  );
}
