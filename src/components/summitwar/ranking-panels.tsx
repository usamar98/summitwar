import Link from "next/link";
import { ArrowUpRight, Crown, Flag, MountainSnow } from "lucide-react";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Startup } from "@/lib/types";

const TOP_PROJECT_COUNT = 8;

function EmptyRank({ rank }: { rank: number }) {
  return (
    <Link
      href="/start"
      className="group flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[.025] px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-primary/5"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 font-mono text-[11px] text-muted-foreground">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">
          Open camp
        </div>
        <div className="text-[10px] text-muted-foreground/65">
          Plant your flag
        </div>
      </div>
      <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
    </Link>
  );
}

function SummitOwner({ startup }: { startup: Startup | null }) {
  if (!startup) {
    return (
      <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4">
        <Badge className="bg-primary/10 text-primary">Summit unclaimed</Badge>
        <h3 className="mt-3 text-lg font-semibold">Your project could lead.</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Claim the first camp and put your logo on the mountain.
        </p>
        <Button asChild size="sm" className="mt-4 w-full">
          <Link href="/start">
            Plant the first flag <ArrowUpRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-4">
      <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <Badge className="bg-primary text-primary-foreground">
          <Crown className="size-3" /> Summit owner
        </Badge>
        <span className="font-mono text-[11px] font-semibold text-primary">
          #1
        </span>
      </div>
      <div className="relative mt-4 flex min-w-0 items-center gap-3">
        <StartupMark
          name={startup.name}
          logoUrl={startup.logoUrl}
          className="size-12 rounded-xl ring-1 ring-primary/50"
        />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {startup.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
            {startup.tagline}
          </p>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Button
          asChild
          size="sm"
          className="bg-primary text-primary-foreground"
        >
          <Link
            href={`/checkout?listing=${startup.id}&amount=${startup.seasonSpendCents / 100 + 1}`}
          >
            Take the Summit <Flag />
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          aria-label={`View ${startup.name}`}
        >
          <Link href={`/startup/${startup.slug}`}>
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TopRank({ startup, rank }: { startup: Startup; rank: number }) {
  return (
    <Link
      href={`/startup/${startup.slug}`}
      className="group flex min-h-14 items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] px-3 py-2.5 transition-colors hover:border-accent/30 hover:bg-accent/5"
    >
      <span className="w-5 shrink-0 text-center font-mono text-[11px] font-semibold text-muted-foreground">
        {rank}
      </span>
      <StartupMark
        name={startup.name}
        logoUrl={startup.logoUrl}
        className="size-8 rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold">{startup.name}</div>
        <div className="truncate text-[10px] text-muted-foreground">
          {startup.tagline}
        </div>
      </div>
      <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover:text-accent" />
    </Link>
  );
}

export function SummitLeaders({ startups }: { startups: Startup[] }) {
  const slots = Array.from(
    { length: TOP_PROJECT_COUNT },
    (_, index) => startups[index] ?? null,
  );
  return (
    <aside
      aria-label="Top eight projects"
      className="rounded-2xl border border-white/8 bg-card/55 p-3 shadow-[0_28px_70px_-52px_rgba(255,205,95,.7)] backdrop-blur"
    >
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[.18em] text-primary">
            Front of the climb
          </div>
          <h2 className="mt-1 text-base font-semibold">Top 8 projects</h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          01—08
        </span>
      </div>
      <div className="space-y-2">
        <SummitOwner startup={slots[0]} />
        {slots.slice(1).map((startup, index) => {
          const rank = index + 2;
          return startup ? (
            <TopRank key={startup.id} startup={startup} rank={rank} />
          ) : (
            <EmptyRank key={rank} rank={rank} />
          );
        })}
      </div>
    </aside>
  );
}

export function MountainClimbers({ startups }: { startups: Startup[] }) {
  return (
    <aside
      aria-label="Projects ranked nine through fifty"
      className="rounded-2xl border border-white/8 bg-card/45 p-3 backdrop-blur xl:h-[660px]"
    >
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[.18em] text-accent">
            <MountainSnow className="size-3" /> On the ascent
          </div>
          <h2 className="mt-1 text-base font-semibold">Ranks 9–50</h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          09—50
        </span>
      </div>
      {startups.length ? (
        <div className="grid max-h-[574px] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
          {startups.map((startup, index) => {
            const rank = startup.currentRank ?? index + 9;
            return (
              <Link
                key={startup.id}
                href={`/startup/${startup.slug}`}
                className="group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-white/8 hover:bg-white/[.045]"
              >
                <span className="w-6 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {rank}
                </span>
                <StartupMark
                  name={startup.name}
                  logoUrl={startup.logoUrl}
                  className="size-7 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium">
                    {startup.name}
                  </div>
                  <div className="truncate text-[9px] text-muted-foreground/75">
                    {startup.tagline}
                  </div>
                </div>
                <ArrowUpRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/10 px-5 text-center text-xs leading-5 text-muted-foreground">
          The trail below the top eight is ready for new projects.
        </div>
      )}
    </aside>
  );
}
