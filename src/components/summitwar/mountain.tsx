"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Crown,
  ExternalLink,
  Flag,
  MountainSnow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { createClient, hasPublicSupabaseEnv } from "@/lib/supabase/client";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Startup } from "@/lib/types";

const camps = Array.from({ length: 50 }, (_, index) => {
  const level = index / 49;
  const y = 104 + level * 492;
  const width = 50 + level * 370;
  const direction = index % 2 === 0 ? -1 : 1;
  const lane = 0.25 + ((index * 17) % 60) / 100;
  return { x: 500 + direction * width * lane, y };
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function InteractiveMountain({
  initialStartups,
}: {
  initialStartups: Startup[];
}) {
  const router = useRouter();
  const [startups, setStartups] = useState(initialStartups);
  const [selected, setSelected] = useState<Startup | null>(null);
  const [avalanche, setAvalanche] = useState(false);
  const summitId = useRef(initialStartups[0]?.id);

  useEffect(() => {
    if (!hasPublicSupabaseEnv()) return;
    const supabase = createClient();
    const channel = supabase
      .channel("summitwar-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ranking_events" },
        async () => {
          const response = await fetch("/api/public/mountain", {
            cache: "no-store",
          });
          if (!response.ok) return;
          const payload = (await response.json()) as { mountain: Startup[] };
          if (payload.mountain[0]?.id !== summitId.current) {
            setAvalanche(true);
            window.setTimeout(() => setAvalanche(false), 1200);
          }
          summitId.current = payload.mountain[0]?.id;
          setStartups(payload.mountain);
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <>
      <div
        className="relative overflow-x-auto rounded-2xl border border-white/8 bg-[#06101c] shadow-[0_40px_100px_-55px_rgba(84,190,187,.55)]"
        aria-label="Interactive top 50 startup mountain"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-primary/8 to-transparent" />
        {avalanche ? (
          <div
            className="avalanche pointer-events-none absolute inset-x-[20%] top-14 z-30 h-40 rounded-[50%] bg-gradient-to-b from-white/90 via-white/35 to-transparent blur-xl"
            aria-label="A summit takeover just occurred"
          />
        ) : null}
        <svg
          viewBox="0 0 1000 660"
          className="min-h-[520px] min-w-[780px] w-full"
          role="img"
          aria-labelledby="mountain-title mountain-description"
        >
          <title id="mountain-title">SummitWar weekly startup mountain</title>
          <desc id="mountain-description">
            The fifty highest sponsored project placements, ordered from the
            golden summit to base camp, with each project logo on its flag.
          </desc>
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#071423" />
              <stop offset="1" stopColor="#0b1b28" />
            </linearGradient>
            <linearGradient id="rock" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#263d4a" />
              <stop offset=".52" stopColor="#102532" />
              <stop offset="1" stopColor="#091824" />
            </linearGradient>
            <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#f5f7ed" />
              <stop offset="1" stopColor="#7f9ca6" />
            </linearGradient>
            <radialGradient id="summitGlow">
              <stop stopColor="#ffdd79" stopOpacity=".8" />
              <stop offset="1" stopColor="#ffbd42" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          <rect width="1000" height="660" fill="url(#sky)" />
          <ellipse
            cx="500"
            cy="95"
            rx="150"
            ry="130"
            fill="url(#summitGlow)"
            filter="url(#glow)"
          />
          <path
            d="M0 220 Q180 125 355 210 T710 170 T1000 210 V0 H0Z"
            fill="#2b6872"
            opacity=".13"
          />
          {Array.from({ length: 38 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 83) % 990}
              cy={20 + ((i * 47) % 230)}
              r={i % 5 === 0 ? 1.7 : 0.8}
              fill="#d7edf2"
              opacity={0.3 + (i % 4) * 0.15}
            />
          ))}
          <path
            d="M55 635 L500 74 L955 635 Z"
            fill="url(#rock)"
            stroke="#496270"
            strokeWidth="2"
          />
          <path
            d="M500 74 L389 224 L451 196 L482 232 L524 182 L563 219 L608 211 Z"
            fill="url(#snow)"
            opacity=".96"
          />
          <path d="M55 635 L500 74 L438 635 Z" fill="#aec3c6" opacity=".07" />
          <path d="M500 74 L955 635 L592 635 Z" fill="#000" opacity=".17" />
          <path
            d="M185 635 Q310 560 389 574 T550 548 T815 635"
            fill="none"
            stroke="#b8d3d2"
            strokeOpacity=".12"
            strokeWidth="4"
          />
          {camps.map((point, index) => {
            const startup = startups[index];
            const rank = index + 1;
            const premium = rank <= 3;
            const size =
              rank === 1 ? 40 : rank <= 3 ? 31 : rank <= 10 ? 24 : 18;
            return (
              <g
                key={rank}
                transform={`translate(${point.x} ${point.y})`}
                role={startup ? "button" : undefined}
                tabIndex={startup ? 0 : undefined}
                aria-label={
                  startup
                    ? `Rank ${rank}, ${startup.name}, ${formatMoney(startup.seasonSpendCents)}`
                    : `Empty camp rank ${rank}`
                }
                className={
                  startup
                    ? "cursor-pointer outline-none focus-visible:[&_circle]:stroke-white"
                    : ""
                }
                onClick={() => startup && setSelected(startup)}
                onKeyDown={(event) => {
                  if (startup && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setSelected(startup);
                  }
                }}
              >
                {rank === 1 ? (
                  <>
                    <path d="M0 -23 V-93" stroke="#ffd56a" strokeWidth="3" />
                    <path d="M0 -92 L58 -76 L0 -58Z" fill="#ffd56a" />
                    <path
                      d="M0 -145 V-78"
                      stroke="#ffd56a"
                      strokeWidth="2"
                      opacity=".5"
                    />
                    <circle
                      cy="-48"
                      r="68"
                      fill="#ffd56a"
                      opacity=".09"
                      className="camp-pulse"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d={`M0 ${-size / 2} V${-size - 24}`}
                      stroke={premium ? "#ffd56a" : "#9fb6bd"}
                      strokeWidth="2"
                    />
                    <path
                      d={`M0 ${-size - 24} L${premium ? 31 : 23} ${-size - 16} L0 ${-size - 8}Z`}
                      fill={
                        premium ? "#ffd56a" : startup ? "#6ab8b0" : "#536772"
                      }
                      opacity={startup ? 1 : 0.45}
                    />
                  </>
                )}
                <circle
                  r={size / 2 + 4}
                  fill={rank === 1 ? "#211b0d" : "#0c1b27"}
                  stroke={premium ? "#ffd56a" : startup ? "#89c8c0" : "#60727b"}
                  strokeWidth={premium ? 3 : 1.5}
                  opacity={startup ? 1 : 0.5}
                />
                {startup ? (
                  <>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                      fontSize={Math.max(8, size * 0.34)}
                      fontWeight="800"
                    >
                      {initials(startup.name)}
                    </text>
                    {startup.logoUrl ? (
                      <>
                        <clipPath id={`startup-logo-${rank}`}>
                          <circle r={size / 2} />
                        </clipPath>
                        <image
                          href={startup.logoUrl}
                          x={-size / 2}
                          y={-size / 2}
                          width={size}
                          height={size}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#startup-logo-${rank})`}
                        />
                      </>
                    ) : null}
                    <rect
                      x={-11}
                      y={size / 2 + 5}
                      width="22"
                      height="12"
                      rx="6"
                      fill={premium ? "#ffd56a" : "#102733"}
                    />
                    <text
                      x="0"
                      y={size / 2 + 14}
                      textAnchor="middle"
                      fill={premium ? "#271c06" : "#dbe8e8"}
                      fontSize="8"
                      fontWeight="700"
                    >
                      #{rank}
                    </text>
                  </>
                ) : (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#8ca0a7"
                    fontSize="7"
                  >
                    {rank}
                  </text>
                )}
              </g>
            );
          })}
          <text x="35" y="628" fill="#6f8992" fontSize="10" letterSpacing="3">
            BASE CAMP · 0M
          </text>
          <text
            x="500"
            y="43"
            textAnchor="middle"
            fill="#ffdc7d"
            fontSize="10"
            fontWeight="700"
            letterSpacing="3"
          >
            THE SUMMIT
          </text>
        </svg>
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-muted-foreground backdrop-blur">
          <MountainSnow className="size-3.5 text-accent" /> Tap a flag to
          inspect
        </div>
      </div>
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent className="overflow-y-auto bg-card p-6 sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="text-left">
                <div className="mb-4 flex items-center gap-4">
                  <StartupMark
                    name={selected.name}
                    logoUrl={selected.logoUrl}
                    className="size-16 text-lg"
                  />
                  <div>
                    <Badge className="mb-2 bg-primary text-primary-foreground">
                      <Crown className="mr-1 size-3" /> Rank #
                      {selected.currentRank}
                    </Badge>
                    <SheetTitle className="text-2xl">
                      {selected.name}
                    </SheetTitle>
                  </div>
                </div>
                <SheetDescription className="text-base leading-7">
                  {selected.tagline}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground">
                    Current season climb
                  </div>
                  <div className="metric-number mt-1 text-xl font-semibold">
                    {formatMoney(selected.seasonSpendCents)}
                  </div>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground">Altitude</div>
                  <div className="metric-number mt-1 text-xl font-semibold">
                    {formatNumber(selected.altitudeMeters)}m
                  </div>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground">
                    Profile views
                  </div>
                  <div className="metric-number mt-1 text-xl font-semibold">
                    ≈{formatNumber(selected.profileViews)}
                  </div>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-xs text-muted-foreground">
                    Verified clicks
                  </div>
                  <div className="metric-number mt-1 text-xl font-semibold">
                    ≈{formatNumber(selected.outboundClicks)}
                  </div>
                </div>
              </div>
              <div className="mt-7 grid gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 bg-primary text-primary-foreground"
                >
                  <Link href={`/checkout?listing=${selected.id}&amount=1`}>
                    <Flag /> Climb past them
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11">
                  <Link href={`/startup/${selected.slug}`}>
                    Full startup profile <ArrowUpRight />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <a href={`/api/out/${selected.id}`} rel="sponsored noopener">
                    Visit website <ExternalLink />
                  </a>
                </Button>
              </div>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                Sponsored placement. A checkout quote does not reserve rank; the
                verified payment is applied to the live leaderboard when its
                webhook arrives.
              </p>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
