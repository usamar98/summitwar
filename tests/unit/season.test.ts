import { describe, expect, it } from "vitest";
import { closeSeason } from "@/lib/domain/season";

describe("weekly avalanche", () => {
  it("creates winner and runner-up records without deleting listings", () => {
    const listings = [
      { id: "a", seasonSpendCents: 300, firstReachedAt: "2026-01-01" },
      { id: "b", seasonSpendCents: 200, firstReachedAt: "2026-01-02" },
    ];
    const closed = closeSeason(listings, new Date("2026-08-24T00:00:00Z"));
    expect(closed.winner?.id).toBe("a");
    expect(closed.runnerUp?.id).toBe("b");
    expect(closed.reset).toHaveLength(2);
    expect(closed.reset.every((item) => item.seasonSpendCents === 0)).toBe(
      true,
    );
  });
});
