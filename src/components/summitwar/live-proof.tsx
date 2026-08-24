import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Eye,
  MousePointerClick,
  Radio,
  TentTree,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/summitwar/countdown";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Season, SiteStats } from "@/lib/types";

export function LiveProof({
  stats,
  season,
  demo,
}: {
  stats: SiteStats;
  season: Season;
  demo: boolean;
}) {
  const metrics = [
    [Radio, "Online now", formatNumber(stats.onlineVisitors)],
    [Eye, "Unique visitors", `≈${formatNumber(stats.uniqueVisitors)}`],
    [
      CircleDollarSign,
      "Verified revenue",
      formatMoney(stats.verifiedRevenueCents),
    ],
    [Activity, "Total climbs", formatNumber(stats.totalClimbs)],
    [
      MousePointerClick,
      "Startup clicks",
      `≈${formatNumber(stats.outboundClicks)}`,
    ],
    [TentTree, "Competing", formatNumber(stats.startupsCompeting)],
  ] as const;
  return (
    <section
      aria-label="Live platform metrics"
      className="border-y border-white/7 bg-black/20"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-10">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">
            <BarChart3 className="size-3.5 text-accent" /> Live proof{" "}
            {demo ? (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                Demo data
              </Badge>
            ) : null}
          </div>
          <div className="text-right text-[10px] uppercase tracking-[.15em] text-muted-foreground">
            <span className="hidden sm:inline">Avalanche in </span>
            <Countdown end={season.endsAt} compact />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3 xl:grid-cols-6">
          {metrics.map(([Icon, label, value]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-white/5 text-accent">
                <Icon className="size-4" />
              </span>
              <div>
                <div className="metric-number text-sm font-semibold text-foreground">
                  {value}
                </div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
