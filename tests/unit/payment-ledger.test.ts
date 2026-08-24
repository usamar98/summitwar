import { describe, expect, it } from "vitest";
import { AtomicPaymentLedger } from "@/lib/domain/ledger";

const rows = () => [
  {
    id: "a",
    seasonSpendCents: 500,
    lifetimeSpendCents: 500,
    firstReachedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "b",
    seasonSpendCents: 200,
    lifetimeSpendCents: 200,
    firstReachedAt: "2026-01-01T00:01:00Z",
  },
];
describe("verified payment application", () => {
  it("applies existing-listing top-ups", async () => {
    const ledger = new AtomicPaymentLedger(rows());
    await ledger.apply({
      eventId: "e1",
      paymentId: "p1",
      listingId: "b",
      amountCents: 400,
      occurredAt: "2026-01-01T00:02:00Z",
    });
    expect(ledger.snapshot()[0]).toMatchObject({
      id: "b",
      seasonSpendCents: 600,
      lifetimeSpendCents: 600,
      rank: 1,
    });
  });
  it("ignores duplicate webhook delivery", async () => {
    const ledger = new AtomicPaymentLedger(rows());
    const payment = {
      eventId: "e1",
      paymentId: "p1",
      listingId: "b",
      amountCents: 100,
      occurredAt: "2026-01-01T00:02:00Z",
    };
    expect((await ledger.apply(payment)).duplicate).toBe(false);
    expect((await ledger.apply(payment)).duplicate).toBe(true);
    expect(
      ledger.snapshot().find((item) => item.id === "b")?.seasonSpendCents,
    ).toBe(300);
  });
  it("serializes simultaneous payments safely", async () => {
    const ledger = new AtomicPaymentLedger(rows());
    await Promise.all([
      ledger.apply({
        eventId: "e1",
        paymentId: "p1",
        listingId: "b",
        amountCents: 200,
        occurredAt: "2026-01-01T00:02:00Z",
      }),
      ledger.apply({
        eventId: "e2",
        paymentId: "p2",
        listingId: "b",
        amountCents: 200,
        occurredAt: "2026-01-01T00:02:01Z",
      }),
    ]);
    expect(ledger.snapshot()[0]).toMatchObject({
      id: "b",
      seasonSpendCents: 600,
    });
  });
  it("uses actual live state when a checkout quote becomes stale", async () => {
    const ledger = new AtomicPaymentLedger(rows());
    await ledger.apply({
      eventId: "competitor",
      paymentId: "p0",
      listingId: "a",
      amountCents: 500,
      occurredAt: "2026-01-01T00:02:00Z",
    });
    const result = await ledger.apply({
      eventId: "mine",
      paymentId: "p1",
      listingId: "b",
      amountCents: 400,
      occurredAt: "2026-01-01T00:03:00Z",
    });
    expect(result.rank).toBe(2);
    expect(
      ledger.snapshot().find((item) => item.id === "b")?.seasonSpendCents,
    ).toBe(600);
  });
});
