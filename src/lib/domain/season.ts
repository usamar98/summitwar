import { getSeasonBounds } from "@/lib/format";
import { rankListings, type Rankable } from "@/lib/domain/ranking";

export function closeSeason<T extends Rankable>(
  listings: readonly T[],
  now = new Date(),
) {
  const ranked = rankListings(
    listings.filter((listing) => listing.seasonSpendCents > 0),
  );
  const bounds = getSeasonBounds(now);
  return {
    winner: ranked[0] ?? null,
    runnerUp: ranked[1] ?? null,
    reset: listings.map((listing) => ({
      ...listing,
      seasonSpendCents: 0,
      firstReachedAt: bounds.endsAt.toISOString(),
    })),
  };
}
