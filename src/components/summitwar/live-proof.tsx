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
import { formatMoney, formatNumber } from "@/lib/format";
import type { SiteStats } from "@/lib/types";

type Metric = readonly [typeof Radio, string, string];

function MetricGroup({
  metrics,
  duplicate = false,
}: {
  metrics: readonly Metric[];
  duplicate?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-8 pr-8"
      aria-hidden={duplicate || undefined}
    >
      {metrics.map(([Icon, label, value]) => (
        <div key={label} className="flex min-w-28 items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-white/5 text-accent">
            <Icon className="size-3.5" />
          </span>
          <div>
            <div className="metric-number text-xs font-semibold text-foreground">
              {value}
            </div>
            <div className="text-[9px] text-muted-foreground">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LiveProof({
  stats,
  demo,
}: {
  stats: SiteStats;
  demo: boolean;
}) {
  const metrics: readonly Metric[] = [
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
      className="border-b border-white/7 bg-black/25"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-4 py-2.5 sm:px-6 lg:px-10">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/8 pr-5 text-[10px] font-medium uppercase tracking-[.18em] text-muted-foreground">
          <BarChart3 className="size-3.5 text-accent" /> Live proof{" "}
          {demo ? (
            <Badge
              variant="outline"
              className="h-5 border-primary/30 bg-primary/10 px-1.5 text-[9px] text-primary"
            >
              Demo data
            </Badge>
          ) : null}
        </div>
        <div
          className="live-proof-slider min-w-0 flex-1"
          aria-label="Sliding live metrics"
        >
          <div className="live-proof-track flex w-max items-center">
            <MetricGroup metrics={metrics} />
            <MetricGroup metrics={metrics} duplicate />
          </div>
        </div>
      </div>
    </section>
  );
}
