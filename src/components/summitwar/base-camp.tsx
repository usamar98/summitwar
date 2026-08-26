"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  AtSign,
  Crown,
  MountainSnow,
  RotateCcw,
  Search,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { formatMoney, formatNumber } from "@/lib/format";
import type { RankingEvent, Startup } from "@/lib/types";

type BattleStatus = {
  label: string;
  className: string;
  icon: typeof Crown;
};

function getBattleStatus(
  startup: Startup,
  latestEvent?: RankingEvent,
): BattleStatus {
  if (latestEvent?.type === "summit_reclaimed") {
    return {
      label: "Reclaimed the Summit",
      className: "border-accent/30 bg-accent/10 text-accent",
      icon: RotateCcw,
    };
  }
  if (latestEvent?.type === "summit_taken" || startup.currentRank === 1) {
    return {
      label: "Captured the Summit",
      className: "border-primary/30 bg-primary/10 text-primary",
      icon: Crown,
    };
  }
  if (startup.currentRank !== null && startup.currentRank <= 8) {
    return {
      label: "Knocked Down",
      className: "border-white/12 bg-white/5 text-muted-foreground",
      icon: TrendingDown,
    };
  }
  return {
    label: startup.hasHeldSummit ? "Former summit holder" : "On the ascent",
    className: "border-white/12 bg-white/5 text-muted-foreground",
    icon: MountainSnow,
  };
}

export function BaseCamp({
  startups,
  events,
}: {
  startups: Startup[];
  events: RankingEvent[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(
    () => [...new Set(startups.map((item) => item.category))].sort(),
    [startups],
  );
  const latestEventByListing = useMemo(() => {
    const result = new Map<string, RankingEvent>();
    for (const event of events) {
      if (event.listingId && !result.has(event.listingId)) {
        result.set(event.listingId, event);
      }
    }
    return result;
  }, [events]);
  const filtered = useMemo(
    () =>
      startups
        .filter(
          (item) =>
            (category === "all" || item.category === category) &&
            `${item.name} ${item.tagline} ${item.founderName} ${item.founderHandle}`
              .toLowerCase()
              .includes(deferredQuery.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "hold"
            ? b.seasonSpendCents - a.seasonSpendCents
            : sort === "clicked"
              ? b.outboundClicks - a.outboundClicks
              : sort === "spend"
                ? b.lifetimeSpendCents - a.lifetimeSpendCents
                : sort === "winners"
                  ? b.summitWins - a.summitWins
                  : b.createdAt.localeCompare(a.createdAt),
        ),
    [startups, deferredQuery, category, sort],
  );
  return (
    <section id="base-camp" className="content-auto scroll-mt-24">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge
            variant="outline"
            className="mb-3 border-accent/25 text-accent"
          >
            All approved projects
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight">
            Project Base Camp
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find every project, its public owner identity, current hold, and
            latest mountain action.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/75">
            Checkout emails remain private. Public X handles appear when a
            founder supplies one.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_160px]">
          <label className="relative">
            <span className="sr-only">Search startups</span>
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects or founders"
              className="pl-9"
            />
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem value={item} key={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger aria-label="Sort listings">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="hold">Strongest hold</SelectItem>
              <SelectItem value="clicked">Most clicked</SelectItem>
              <SelectItem value="spend">Lifetime spend</SelectItem>
              <SelectItem value="winners">Summit winners</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>
          Showing {formatNumber(filtered.length)} of{" "}
          {formatNumber(startups.length)} projects
        </span>
        <span>Public directory · live rankings</span>
      </div>
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((startup) => {
            const status = getBattleStatus(
              startup,
              latestEventByListing.get(startup.id),
            );
            const StatusIcon = status.icon;
            const xHandle = startup.founderHandle.replace(/^@/, "");
            return (
              <Card
                key={startup.id}
                className="group h-full overflow-hidden transition-colors hover:border-accent/35"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <StartupMark
                      name={startup.name}
                      logoUrl={startup.logoUrl}
                      className="size-12 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/startup/${startup.slug}`}
                          className="flex min-w-0 items-center gap-1 font-semibold group-hover:text-accent"
                        >
                          <span className="truncate">{startup.name}</span>
                          <ArrowUpRight className="size-3.5 shrink-0" />
                        </Link>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[9px]"
                        >
                          {startup.currentRank
                            ? `#${startup.currentRank}`
                            : "Camp"}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {startup.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={status.className}>
                      <StatusIcon className="size-3" /> {status.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-white/10 text-[9px] text-muted-foreground"
                    >
                      {startup.category}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-black/20 p-3 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Current hold</div>
                      <div className="metric-number mt-1 font-mono text-sm font-semibold text-primary">
                        {formatMoney(startup.seasonSpendCents)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">
                        Verified clicks
                      </div>
                      <div className="metric-number mt-1 font-mono text-sm font-semibold">
                        ≈{formatNumber(startup.outboundClicks)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex min-w-0 items-center justify-between gap-2 border-t border-white/8 pt-3 text-[10px] text-muted-foreground">
                    <span className="truncate">
                      Owner · {startup.founderName}
                    </span>
                    {xHandle ? (
                      <a
                        href={`https://x.com/${encodeURIComponent(xHandle)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 hover:text-accent"
                        aria-label={`${startup.name} owner on X`}
                      >
                        <AtSign className="size-3" /> {xHandle}
                      </a>
                    ) : (
                      <span className="shrink-0">No public X</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            No listings match these filters.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
