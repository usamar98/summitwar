export type RankPoint = { at: string; rank: number; altitudeMeters: number };

export type PublicPayment = {
  id: string;
  amountCents: number;
  createdAt: string;
};

export type Startup = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  website: string;
  logoUrl: string | null;
  founderName: string;
  founderHandle: string;
  category: string;
  launchYear: number;
  currentRank: number | null;
  seasonSpendCents: number;
  lifetimeSpendCents: number;
  altitudeMeters: number;
  profileViews: number;
  outboundClicks: number;
  summitWins: number;
  totalSummitSeconds: number;
  firstReachedAt: string;
  createdAt: string;
  rankHistory: RankPoint[];
  paymentHistory: PublicPayment[];
};

export type RankingEvent = {
  id: string;
  type:
    | "joined"
    | "climbed"
    | "summit_taken"
    | "summit_reclaimed"
    | "overtaken"
    | "season_started";
  message: string;
  listingId: string | null;
  createdAt: string;
};

export type Season = {
  id: string;
  number: number;
  startsAt: string;
  endsAt: string;
  status: "active" | "closed" | "upcoming";
  winner: Startup | null;
  runnerUp: Startup | null;
  winningSpendCents: number;
  winningAltitudeMeters: number;
  winnerClicks: number;
  winnerSummitSeconds: number;
};

export type SiteStats = {
  verifiedRevenueCents: number;
  revenueTodayCents: number;
  revenueSeasonCents: number;
  paymentCount: number;
  averagePaymentCents: number;
  largestPaymentCents: number;
  paidStartups: number;
  onlineVisitors: number;
  uniqueVisitors: number;
  profileViews: number;
  outboundClicks: number;
  ctr: number;
  totalClimbs: number;
  startupsCompeting: number;
  daily: Array<{
    date: string;
    revenueCents: number;
    climbs: number;
    clicks: number;
  }>;
};

export type HomeData = {
  demo: boolean;
  season: Season;
  mountain: Startup[];
  baseCamp: Startup[];
  events: RankingEvent[];
  stats: SiteStats;
  testimonials: Array<{
    id: string;
    quote: string;
    founderName: string;
    startupName: string;
  }>;
};
