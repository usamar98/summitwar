import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  Flag,
  MountainSnow,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { JsonLd } from "@/components/summitwar/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About SummitWar's Transparent Startup Discovery Platform",
  description:
    "Learn why SummitWar exists, how its sponsored startup leaderboard stays transparent, and what founders and visitors can verify publicly.",
  path: "/about",
  imageAlt: "About SummitWar's transparent startup discovery mountain",
});

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Startup leaderboard",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "About SummitWar",
          item: absoluteUrl("/about"),
        },
      ],
    },
    {
      "@type": "AboutPage",
      "@id": absoluteUrl("/about"),
      name: "About SummitWar",
      description:
        "SummitWar is a transparent sponsored startup leaderboard and project discovery platform.",
      url: absoluteUrl("/about"),
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: { "@id": `${absoluteUrl("/")}#organization` },
    },
  ],
};

export default function AboutPage() {
  return (
    <div className="site-grid min-h-screen">
      <JsonLd data={aboutJsonLd} />
      <section className="border-b border-white/6">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <Badge variant="outline" className="border-primary/25 text-primary">
            <MountainSnow className="size-3" /> Why SummitWar exists
          </Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Startup discovery should be exciting—and honest about what moves a
            project upward.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            SummitWar turns sponsored startup discovery into a public mountain
            race. Founders can plant a project flag, visitors can discover new
            tools, and everyone sees the same ranking rules, verified holds,
            activity history, and sponsorship disclosure.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground"
            >
              <Link href="/start">
                Plant your project flag <Flag />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/rules">
                Read every ranking rule <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          <Principle
            icon={Eye}
            title="Discovery for curious visitors"
            body="Every approved project receives a public profile with its pitch, website, category, current position, rank history, and privacy-conscious engagement signals. Visitors can browse the live mountain or use the category directory to find relevant products."
          />
          <Principle
            icon={Flag}
            title="Visibility for independent founders"
            body="A founder can start with a whole-dollar climb, receive an actual live position after payment verification, and keep a permanent project profile even when the weekly mountain resets. Every paid outbound link is explicitly labelled as sponsored."
          />
          <Principle
            icon={ReceiptText}
            title="Payments and rank stay connected"
            body="The browser cannot manufacture altitude. Stripe-hosted Checkout collects payment, a signed webhook confirms the transaction, and one database transaction recalculates the ranking. Duplicate payment events cannot credit the same climb twice."
          />
          <Principle
            icon={ShieldCheck}
            title="Privacy without vague metrics"
            body="Checkout emails and raw IP addresses are not published. Public visitor and click totals are labelled approximate, known bots are ignored, and activity is deduplicated. Revenue is described as transaction revenue—not recurring revenue or product quality."
          />
        </div>

        <Card className="mt-10 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/5">
          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_.9fr] lg:items-center">
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[.18em] text-accent">
                  What the leaderboard means
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Position measures verified sponsored hold—not which product is
                  “best.”
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  SummitWar does not use votes, reviews, staff picks, or a
                  hidden recommendation score. Higher verified seasonal hold
                  creates a higher position; an earlier project wins a tied
                  hold. This makes the commercial mechanism inspectable while
                  leaving product evaluation to each visitor.
                </p>
              </div>
              <div className="grid gap-3">
                <TrustRow label="Ranking formula" value="Published" />
                <TrustRow label="Payment confirmation" value="Signed webhook" />
                <TrustRow label="Activity history" value="Immutable ledger" />
                <TrustRow label="Season reset" value="Monday 00:00 UTC" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 grid gap-8 border-t border-white/8 pt-10 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">A mountain with memory</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Seasonal position resets keep the competition open. Project
              profiles, lifetime history, summit wins, public activity, and the
              Hall of Fame remain discoverable, giving both new challengers and
              past champions a durable record.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              Built around verifiable pages
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The public site includes dedicated project profiles, category
              discovery, live statistics, ranking rules, activity records, and
              champion history. Search engines and AI systems receive the same
              canonical pages and structured descriptions people can inspect.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Principle({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Eye;
  title: string;
  body: string;
}) {
  return (
    <Card className="bg-card/55">
      <CardContent className="p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon className="size-4.5" />
        </span>
        <h2 className="mt-5 text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function TrustRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/20 p-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
