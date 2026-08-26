import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Flag,
  MountainSnow,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";
import { JsonLd } from "@/components/summitwar/json-ld";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { findCategoryGroup } from "@/lib/categories";
import { getHomeData } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  buildCategoryJsonLd,
  createPageMetadata,
  truncateSearchDescription,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

async function getCategory(slug: string) {
  const data = await getHomeData();
  const projects = [...data.mountain, ...data.baseCamp];
  return findCategoryGroup(projects, slug);
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const group = await getCategory(slug);
  if (!group) {
    return createPageMetadata({
      title: "Project Category Not Found",
      description:
        "Browse active SummitWar startup and indie project categories.",
      path: `/category/${slug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: `Best ${group.name} Startups & Indie Projects`,
    description: truncateSearchDescription(
      `Discover ${group.projects.length} ${group.name} startup${group.projects.length === 1 ? "" : "s"} and indie project${group.projects.length === 1 ? "" : "s"} competing on SummitWar's transparent live leaderboard.`,
    ),
    path: `/category/${group.slug}`,
    imageAlt: `${group.name} startups and projects on SummitWar`,
    noIndex: group.projects.length < 2,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const group = await getCategory(slug);
  if (!group) notFound();

  return (
    <div className="site-grid min-h-screen">
      <JsonLd data={buildCategoryJsonLd(group, group.projects)} />
      <section className="border-b border-white/6">
        <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="size-3.5" /> All project categories
          </Link>
          <Badge
            variant="outline"
            className="mt-7 block w-fit border-primary/25 text-primary"
          >
            {formatNumber(group.projects.length)} live project
            {group.projects.length === 1 ? "" : "s"}
          </Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {group.name} startups and indie projects
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Discover founder-led {group.name} products through a transparent
            sponsored leaderboard. Compare each project&apos;s pitch, current
            mountain hold, public profile, and verified outbound interest.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground"
            >
              <Link href="/start">
                Compete in {group.name} <Flag />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#mountain">See the full leaderboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[.18em] text-accent">
              Current category field
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Projects ranked by verified hold
            </h2>
          </div>
          <div className="font-mono text-sm text-primary">
            {formatMoney(group.totalHoldCents)} combined hold
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {group.projects.map((project, index) => (
            <Card key={project.id} className="overflow-hidden">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <StartupMark
                    name={project.name}
                    logoUrl={project.logoUrl}
                    className="size-12 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground">
                          Category position #{index + 1}
                        </div>
                        <h3 className="mt-1 truncate text-lg font-semibold">
                          {project.name}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-primary/25 text-primary"
                      >
                        {formatMoney(project.seasonSpendCents)}
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {project.tagline}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <MousePointerClick className="size-3" /> ≈
                    {formatNumber(project.outboundClicks)} verified clicks
                  </span>
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="text-accent"
                  >
                    <Link href={`/startup/${project.slug}`}>
                      View project <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Explainer
            icon={MountainSnow}
            title="One global mountain"
            body={`${group.name} projects keep their overall SummitWar rank. This page creates a focused discovery view without inventing a separate score.`}
          />
          <Explainer
            icon={ShieldCheck}
            title="Verified movement only"
            body="Rank changes happen only after a signed Stripe payment webhook. Browser redirects, votes, and private editorial preferences cannot move a flag."
          />
          <Explainer
            icon={MousePointerClick}
            title="Useful public signals"
            body="Visitors can compare each pitch, mountain position, current hold, public owner identity, and privacy-conscious outbound click count."
          />
        </div>

        <p className="mt-10 rounded-xl border border-primary/15 bg-primary/5 p-5 text-xs leading-6 text-muted-foreground">
          <strong className="text-foreground">
            Sponsored-placement notice:
          </strong>{" "}
          payment determines position, not product quality. SummitWar category
          pages are discovery directories and do not represent reviews,
          endorsements, or editorial recommendations.
        </p>
      </section>
    </div>
  );
}

function Explainer({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof MountainSnow;
  title: string;
  body: string;
}) {
  return (
    <Card className="bg-card/55">
      <CardContent className="p-5">
        <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent">
          <Icon className="size-4" />
        </span>
        <h2 className="mt-4 font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
