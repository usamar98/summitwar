export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days ? `${days}d ${hours}h` : `${hours}h`;
}

export function getSeasonBounds(now = new Date()) {
  const day = now.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const startsAt = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysSinceMonday,
    ),
  );
  const endsAt = new Date(startsAt.getTime() + 7 * 86400_000 - 1);
  return { startsAt, endsAt };
}

export function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86400_000).toISOString();
}
