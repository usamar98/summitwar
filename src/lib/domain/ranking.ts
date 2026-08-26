export type Rankable = {
  id: string;
  seasonSpendCents: number;
  firstReachedAt: string;
};

export const MOUNTAIN_CAPACITY = 20;

export function altitudeForCents(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new Error("Invalid cents");
  return (cents / 100) * 100;
}

export function rankListings<T extends Rankable>(listings: readonly T[]) {
  return [...listings].sort((a, b) => {
    if (a.seasonSpendCents !== b.seasonSpendCents) {
      return b.seasonSpendCents - a.seasonSpendCents;
    }
    const reached = a.firstReachedAt.localeCompare(b.firstReachedAt);
    return reached || a.id.localeCompare(b.id);
  });
}

export function amountToOvertakeCents(
  currentCents: number,
  targetCents: number,
) {
  if (![currentCents, targetCents].every(Number.isSafeInteger)) {
    throw new Error("Amounts must use integer cents");
  }
  return Math.max(100, targetCents - currentCents + 100);
}

export function quoteClimbOptions(
  listing: Pick<Rankable, "id" | "seasonSpendCents">,
  ranked: readonly Rankable[],
) {
  const ordered = rankListings(ranked);
  const index = ordered.findIndex((item) => item.id === listing.id);
  const summit = ordered[0];
  const next = index > 0 ? ordered[index - 1] : null;
  return {
    nextPositionCents: next
      ? amountToOvertakeCents(listing.seasonSpendCents, next.seasonSpendCents)
      : 100,
    summitCents:
      summit && summit.id !== listing.id
        ? amountToOvertakeCents(
            listing.seasonSpendCents,
            summit.seasonSpendCents,
          )
        : 100,
  };
}
