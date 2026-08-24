"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
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
import type { Startup } from "@/lib/types";

export function BaseCamp({ startups }: { startups: Startup[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const deferredQuery = useDeferredValue(query);
  const categories = useMemo(
    () => [...new Set(startups.map((item) => item.category))].sort(),
    [startups],
  );
  const filtered = useMemo(
    () =>
      startups
        .filter(
          (item) =>
            (category === "all" || item.category === category) &&
            `${item.name} ${item.tagline}`
              .toLowerCase()
              .includes(deferredQuery.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "clicked"
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
            Beyond the top 50
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight">Base Camp</h2>
          <p className="mt-2 text-muted-foreground">
            Every approved startup stays discoverable after it leaves the
            mountain.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_160px]">
          <label className="relative">
            <span className="sr-only">Search startups</span>
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Base Camp"
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
              <SelectItem value="clicked">Most clicked</SelectItem>
              <SelectItem value="spend">Lifetime spend</SelectItem>
              <SelectItem value="winners">Summit winners</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((startup) => (
            <Link
              href={`/startup/${startup.slug}`}
              key={startup.id}
              className="group"
            >
              <Card className="h-full transition-colors hover:border-accent/35">
                <CardContent className="flex items-center gap-4 p-5">
                  <StartupMark name={startup.name} logoUrl={startup.logoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold group-hover:text-accent">
                        {startup.name}
                      </h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {startup.category}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {startup.tagline}
                    </p>
                    <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
                      <span>
                        {formatMoney(startup.lifetimeSpendCents)} lifetime
                      </span>
                      <span>
                        ≈{formatNumber(startup.outboundClicks)} clicks
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
