import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  FolderSearch,
  MountainSnow,
  MousePointerClick,
} from "lucide-react";
import { JsonLd } from "@/components/summitwar/json-ld";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { groupProjectsByCategory } from "@/lib/categories";
import { getHomeData } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { buildCategoriesJsonLd, createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Startup Categories & Indie Project Directory",
  description:
    "Browse startup categories, SaaS products, founder-led tools, and indie projects competing on SummitWar's transparent live leaderboard.",
  path: "/categories",
  imageAlt: "SummitWar startup and indie project categories",
});

export default async function CategoriesPage() {
  const data = await getHomeData();
  const projects = [...data.mountain, ...data.baseCamp];
  const groups = groupProjectsByCategory(projects);
  const totalClicks = groups.reduce(
    (total, group) => total + group.totalClicks,
    0,
  );

  return (
    <div className="site-grid min-h-screen">
      <JsonLd data={buildCategoriesJsonLd(groups)} />
      <section className="border-b border-white/6">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <Badge variant="outline" className="border-accent/25 text-accent">
            <FolderSearch className="size-3" /> Project discovery
          </Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Browse startups and indie products by category.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Explore every approved SummitWar project through a useful category
            directory. Positions remain sponsored and transparent; category
            pages organize discovery without changing the live mountain rank.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground"
            >
              <Link href="/start">
                Plant your project flag <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#mountain">View the live mountain</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Metric label="Categories" value={formatNumber(groups.length)} />
            <Metric
              label="Approved projects"
              value={formatNumber(projects.length)}
            />
            <Metric
              label="Verified outbound clicks"
              value={`≈${formatNumber(totalClicks)}`}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[.18em] text-primary">
              Discovery routes
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Find your next useful project
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Category totals use current-season verified holds. Clicks are
            privacy-conscious approximations.
          </p>
        </div>

        {groups.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <Card
                id={group.slug}
                key={group.slug}
                className="scroll-mt-24 overflow-hidden transition-colors hover:border-accent/30"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge
                        variant="outline"
                        className="border-white/10 text-[10px]"
                      >
                        {formatNumber(group.projects.length)} project
                        {group.projects.length === 1 ? "" : "s"}
                      </Badge>
                      <h3 className="mt-3 text-xl font-semibold">
                        {group.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-semibold text-primary">
                        {formatMoney(group.totalHoldCents)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        category hold
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {group.projects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/startup/${project.slug}`}
                        className="group flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-3 transition-colors hover:border-accent/25 hover:bg-accent/5"
                      >
                        <StartupMark
                          name={project.name}
                          logoUrl={project.logoUrl}
                          className="size-9 rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium group-hover:text-accent">
                            {project.name}
                          </div>
                          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {project.tagline}
                          </div>
                        </div>
                        <span className="font-mono text-xs text-primary">
                          {formatMoney(project.seasonSpendCents)}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <MousePointerClick className="size-3" /> ≈
                      {formatNumber(group.totalClicks)} verified clicks
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-accent"
                    >
                      <Link href={`/category/${group.slug}`}>
                        Explore category <ArrowUpRight />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="grid min-h-52 place-items-center p-8 text-center">
              <div>
                <MountainSnow className="mx-auto size-7 text-accent" />
                <h2 className="mt-4 font-semibold">The category map is open</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The first approved project will establish the first category.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-card/55 p-4">
      <div className="metric-number text-xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
