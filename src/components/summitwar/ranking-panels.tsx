import Link from "next/link";
import {
  ArrowUpRight,
  Crown,
  MountainSnow,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { SectorChallengeForm } from "@/components/summitwar/sector-challenge-form";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Badge } from "@/components/ui/badge";
import type { Startup } from "@/lib/types";

function statusForProject(startup: Startup, rank: number) {
  if (rank === 1) {
    return {
      label: "Capture the Summit",
      icon: Crown,
      className: "border-primary/30 bg-primary/10 text-primary",
    };
  }
  if (startup.hasHeldSummit || startup.summitWins > 0) {
    return {
      label: "Reclaim the Summit",
      icon: RotateCcw,
      className: "border-accent/30 bg-accent/10 text-accent",
    };
  }
  return {
    label: "Knocked down",
    icon: TrendingDown,
    className: "border-white/12 bg-white/5 text-muted-foreground",
  };
}

function ProjectSectorCard({
  startup,
  latest,
}: {
  startup: Startup;
  latest: boolean;
}) {
  const rank = startup.currentRank ?? 1;
  const status = statusForProject(startup, rank);
  const StatusIcon = status.icon;
  const submitted = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(startup.createdAt));
  const rankLabel = String(rank).padStart(2, "0");

  return (
    <article
      className={`relative overflow-hidden rounded-[20px] border bg-[#0d0e12]/95 p-4 shadow-[0_24px_60px_-42px_rgba(0,0,0,.95)] ${
        rank === 1 ? "border-primary/35" : "border-white/12"
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${
          rank === 1 ? "from-primary/[.055]" : "from-accent/[.035]"
        } to-transparent`}
      />
      <div className="flex items-center justify-between gap-3">
        <div
          className={`font-mono text-[10px] font-semibold uppercase tracking-[.2em] ${
            rank === 1 ? "text-primary" : "text-accent"
          }`}
        >
          Summit sector {rankLabel}
        </div>
        <span
          aria-hidden="true"
          className={`size-4 rounded-[5px] border shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)] ${
            rank === 1
              ? "border-primary/80 bg-primary"
              : "border-accent/70 bg-accent"
          }`}
        />
      </div>
      <h3 className="relative mt-2 truncate text-xl font-semibold tracking-tight">
        {startup.name}
      </h3>
      <p className="relative mt-0.5 font-mono text-[10px] text-muted-foreground">
        Rank #{rank} on the mountain · current sector
      </p>

      <div className="relative mt-4 rounded-xl border border-white/12 bg-white/[.035] p-3">
        <div className="mb-2.5 text-[10px] text-muted-foreground">
          Currently held by
        </div>
        <Link
          href={`/startup/${startup.slug}`}
          className="group flex min-w-0 items-start gap-3"
          aria-label={`View ${startup.name} project profile`}
        >
          <StartupMark
            name={startup.name}
            logoUrl={startup.logoUrl}
            className="mt-0.5 size-12 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight">
              {startup.name}
            </div>
            <p className="mt-1 line-clamp-3 text-[11px] leading-[1.55] text-muted-foreground">
              {startup.tagline}
            </p>
          </div>
          <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/8 pt-2.5 text-[9px] text-muted-foreground">
          <span>Current holder</span>
          <time dateTime={startup.createdAt}>Since {submitted}</time>
        </div>
      </div>

      <p className="relative mt-4 text-[11px] leading-[1.65] text-muted-foreground">
        Challenge with your project. Earn a stronger position and take over
        sector #{rank}.
      </p>

      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className={status.className}>
          <StatusIcon className="size-3" /> {status.label}
        </Badge>
        {latest ? (
          <span className="text-[9px] font-medium uppercase tracking-[.12em] text-accent">
            Latest submitted project
          </span>
        ) : (
          <time
            dateTime={startup.createdAt}
            className="text-[9px] text-muted-foreground"
          >
            Submitted {submitted}
          </time>
        )}
      </div>
      <SectorChallengeForm
        startupId={startup.id}
        startupName={startup.name}
        rank={rank}
      />
    </article>
  );
}

export function SummitLeaders({ startups }: { startups: Startup[] }) {
  const latestProject = startups.reduce<Startup | null>(
    (latest, startup) =>
      !latest || startup.createdAt > latest.createdAt ? startup : latest,
    null,
  );
  return (
    <aside aria-label="Top eight projects" className="min-w-0">
      <div className="mb-3 flex items-end justify-between px-1.5">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[.18em] text-primary">
            Project strongholds
          </div>
          <h2 className="mt-1 text-base font-semibold">Ranks 1–8</h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          01—08
        </span>
      </div>
      {startups.length ? (
        <div className="grid gap-3 xl:max-h-[820px] xl:overflow-y-auto xl:pr-1.5">
          {startups.map((startup) => (
            <ProjectSectorCard
              key={startup.id}
              startup={startup}
              latest={startup.id === latestProject?.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
          No project holds a top-eight sector yet.
        </div>
      )}
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
