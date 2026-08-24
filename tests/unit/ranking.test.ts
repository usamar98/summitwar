import { describe, expect, it } from "vitest";
import {
  altitudeForCents,
  amountToOvertakeCents,
  quoteClimbOptions,
  rankListings,
} from "@/lib/domain/ranking";

describe("ranking rules", () => {
  it("converts each dollar to one hundred metres using integer cents", () => {
    expect(altitudeForCents(8400)).toBe(8400);
    expect(() => altitudeForCents(1.5)).toThrow();
  });
  it("orders equal totals by who reached the amount first", () => {
    const ranked = rankListings([
      {
        id: "later",
        seasonSpendCents: 1000,
        firstReachedAt: "2026-01-01T00:01:00Z",
      },
      {
        id: "first",
        seasonSpendCents: 1000,
        firstReachedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    expect(ranked.map((item) => item.id)).toEqual(["first", "later"]);
  });
  it("requires the exact difference plus one dollar", () => {
    expect(amountToOvertakeCents(500, 1200)).toBe(800);
    expect(amountToOvertakeCents(1200, 1200)).toBe(100);
  });
  it("quotes next and summit independently", () => {
    const rows = [
      { id: "top", seasonSpendCents: 2000, firstReachedAt: "2026-01-01" },
      { id: "middle", seasonSpendCents: 900, firstReachedAt: "2026-01-02" },
      { id: "me", seasonSpendCents: 300, firstReachedAt: "2026-01-03" },
    ];
    expect(quoteClimbOptions(rows[2], rows)).toEqual({
      nextPositionCents: 700,
      summitCents: 1800,
    });
  });
});
