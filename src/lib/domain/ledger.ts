import { rankListings, type Rankable } from "@/lib/domain/ranking";

type LedgerListing = Rankable & { lifetimeSpendCents: number };
type LedgerPayment = {
  eventId: string;
  paymentId: string;
  listingId: string;
  amountCents: number;
  occurredAt: string;
};

export class AtomicPaymentLedger {
  private readonly processedEvents = new Set<string>();
  private readonly processedPayments = new Set<string>();
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly listings: LedgerListing[]) {}

  apply(payment: LedgerPayment) {
    const operation = this.queue.then(() => this.applyLocked(payment));
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  snapshot() {
    return rankListings(this.listings).map((listing, index) => ({
      ...listing,
      rank: index + 1,
    }));
  }

  private applyLocked(payment: LedgerPayment) {
    if (
      this.processedEvents.has(payment.eventId) ||
      this.processedPayments.has(payment.paymentId)
    )
      return { duplicate: true } as const;
    if (
      !Number.isSafeInteger(payment.amountCents) ||
      payment.amountCents < 100 ||
      payment.amountCents % 100 !== 0
    )
      throw new Error("Payment must be whole dollars");
    const listing = this.listings.find((item) => item.id === payment.listingId);
    if (!listing) throw new Error("Unknown listing");
    this.processedEvents.add(payment.eventId);
    this.processedPayments.add(payment.paymentId);
    listing.seasonSpendCents += payment.amountCents;
    listing.lifetimeSpendCents += payment.amountCents;
    listing.firstReachedAt = payment.occurredAt;
    const rank =
      this.snapshot().find((item) => item.id === listing.id)?.rank ?? null;
    return { duplicate: false, rank } as const;
  }
}

export class EventDeduplicator {
  private readonly buckets = new Set<string>();
  record(listingId: string, visitorHash: string, bucket: string) {
    const key = `${listingId}:${visitorHash}:${bucket}`;
    if (this.buckets.has(key)) return false;
    this.buckets.add(key);
    return true;
  }
}

export function ownerCanManage(
  ownerId: string,
  listingId: string,
  rows: Array<{ ownerId: string; listingId: string }>,
) {
  return rows.some(
    (row) => row.ownerId === ownerId && row.listingId === listingId,
  );
}
