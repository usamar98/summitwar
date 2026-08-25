import { getSeasonBounds } from "@/lib/format";
import type {
  HomeData,
  RankingEvent,
  Season,
  SiteStats,
  Startup,
} from "@/lib/types";

const names = [
  "Northstar AI",
  "Pylon",
  "Fjord",
  "Lantern",
  "OrbitKit",
  "Ember",
  "Kiteframe",
  "PlainSight",
  "Arcade Labs",
  "Fieldnote",
  "Pinecone Studio",
  "RelayFox",
  "Sundial",
  "Morrow",
  "Altitude",
  "Peakflow",
  "SignalDesk",
  "Copper",
  "Tandem",
  "Monument",
  "NimbleCloud",
  "Foundry",
  "Brisk",
  "Upslope",
  "Scoutly",
  "Ridge",
  "Wavelength",
  "Cinder",
  "Waypoint",
  "Treeline",
  "Sierra",
  "Topograph",
  "Aster",
  "ValleyOS",
  "Trailhead",
  "Alpenglow",
  "Glacier",
  "Switchback",
  "Snowcap",
  "Highline",
  "Campfire",
  "Quartz",
  "Granite",
  "Outpost",
  "Boulder",
  "Ridgeline",
  "Vista",
  "Cairn",
  "Solstice",
  "Ascend",
  "Basecamp Bio",
  "Moraine",
  "Hearth",
  "Summitly",
  "Icefield",
];
const categories = [
  "AI",
  "Developer tools",
  "Fintech",
  "Design",
  "Productivity",
  "Climate",
];

const { startsAt, endsAt } = getSeasonBounds();

export const demoStartups: Startup[] = names.map((name, index) => {
  const spend = Math.max(100, 4200 - index * 73);
  const clicks = Math.max(4, 640 - index * 9);
  return {
    id: `demo-${index + 1}`,
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    name,
    tagline:
      index === 0
        ? "The decision layer for teams shipping ambitious products."
        : `${categories[index % categories.length]} built for the next ascent.`,
    description:
      "A demonstration startup profile showing how approved companies appear on SummitWar. Production starts with no demo listings.",
    website: `https://example.com/${index + 1}`,
    logoUrl: null,
    founderName: `Demo Founder ${index + 1}`,
    founderHandle: `@demo${index + 1}`,
    category: categories[index % categories.length],
    launchYear: 2024 + (index % 3),
    currentRank: index < 50 ? index + 1 : null,
    seasonSpendCents: spend,
    lifetimeSpendCents: spend + (index % 4) * 2300,
    altitudeMeters: spend,
    profileViews: clicks * 3,
    outboundClicks: clicks,
    summitWins: index < 3 ? 3 - index : 0,
    hasHeldSummit: index < 3,
    totalSummitSeconds: index === 0 ? 14120 : index === 1 ? 8600 : 0,
    firstReachedAt: new Date(
      startsAt.getTime() + index * 120_000,
    ).toISOString(),
    createdAt: new Date(startsAt.getTime() - index * 86400_000).toISOString(),
    rankHistory: Array.from({ length: 7 }, (_, day) => ({
      at: new Date(startsAt.getTime() + day * 86400_000).toISOString(),
      rank: Math.max(1, (index % 12) + 8 - day),
      altitudeMeters: Math.max(100, spend - (6 - day) * 300),
    })),
    paymentHistory: [
      {
        id: `demo-payment-${index}`,
        amountCents: spend,
        createdAt: startsAt.toISOString(),
      },
    ],
  };
});

export const demoEvents: RankingEvent[] = [
  {
    id: "e1",
    type: "summit_taken",
    message: "Northstar AI pushed Pylon off the summit.",
    listingId: "demo-1",
    createdAt: new Date(Date.now() - 180_000).toISOString(),
  },
  {
    id: "e2",
    type: "climbed",
    message: "Fjord climbed from #18 to #3.",
    listingId: "demo-3",
    createdAt: new Date(Date.now() - 620_000).toISOString(),
  },
  {
    id: "e3",
    type: "joined",
    message: "Icefield joined Base Camp for $1.",
    listingId: "demo-55",
    createdAt: new Date(Date.now() - 1_200_000).toISOString(),
  },
  {
    id: "e4",
    type: "summit_reclaimed",
    message: "Pylon reclaimed the summit before Northstar AI answered.",
    listingId: "demo-2",
    createdAt: new Date(Date.now() - 2_000_000).toISOString(),
  },
];

export const demoStats: SiteStats = {
  verifiedRevenueCents: 1842300,
  revenueTodayCents: 42800,
  revenueSeasonCents: demoStartups.reduce(
    (total, item) => total + item.seasonSpendCents,
    0,
  ),
  paymentCount: 481,
  averagePaymentCents: 3830,
  largestPaymentCents: 420000,
  paidStartups: demoStartups.length,
  onlineVisitors: 87,
  uniqueVisitors: 12340,
  profileViews: 38920,
  outboundClicks: 7460,
  ctr: 19.2,
  totalClimbs: 481,
  startupsCompeting: demoStartups.length,
  daily: Array.from({ length: 14 }, (_, index) => ({
    date: new Date(Date.now() - (13 - index) * 86400_000)
      .toISOString()
      .slice(0, 10),
    revenueCents: 18000 + ((index * 7919) % 36000),
    climbs: 7 + ((index * 5) % 19),
    clicks: 210 + ((index * 83) % 370),
  })),
};

export const demoSeason: Season = {
  id: "demo-season",
  number: 12,
  startsAt: startsAt.toISOString(),
  endsAt: endsAt.toISOString(),
  status: "active",
  winner: null,
  runnerUp: null,
  winningSpendCents: 0,
  winningAltitudeMeters: 0,
  winnerClicks: 0,
  winnerSummitSeconds: 0,
};

export const demoHomeData: HomeData = {
  demo: true,
  season: demoSeason,
  mountain: demoStartups.slice(0, 50),
  baseCamp: demoStartups.slice(50),
  events: demoEvents,
  stats: demoStats,
  testimonials: [],
};
