import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { parseStripeCheckoutEvent } from "@/lib/payments/stripe-events";

const paymentId = "550e8400-e29b-41d4-a716-446655440000";

function event(paymentStatus: "paid" | "unpaid" = "paid"): Stripe.Event {
  return {
    id: "evt_test_paid",
    type: "checkout.session.completed",
    created: 1_785_000_000,
    data: {
      object: {
        id: "cs_test_checkout",
        mode: "payment",
        payment_status: paymentStatus,
        amount_total: 4300,
        currency: "usd",
        client_reference_id: paymentId,
        metadata: {
          summitwar_payment_id: paymentId,
          summitwar_listing_id: "listing-id",
        },
        payment_intent: "pi_test_paid",
        customer_email: "founder@example.com",
        customer_details: null,
      },
    },
  } as unknown as Stripe.Event;
}

describe("Stripe paid Checkout parsing", () => {
  it("extracts only server-verified fulfillment fields", () => {
    expect(parseStripeCheckoutEvent(event())).toEqual({
      kind: "paid",
      paymentId,
      providerPaymentId: "pi_test_paid",
      amountCents: 4300,
      currency: "usd",
      email: "founder@example.com",
      occurredAt: new Date(1_785_000_000 * 1000).toISOString(),
    });
  });

  it("does not fulfill an unpaid completed Checkout Session", () => {
    expect(parseStripeCheckoutEvent(event("unpaid"))).toEqual({
      kind: "pending",
    });
  });

  it("ignores unrelated Stripe event types", () => {
    const unrelated = event();
    unrelated.type = "customer.created";
    expect(parseStripeCheckoutEvent(unrelated)).toEqual({ kind: "ignored" });
  });

  it("rejects a paid event without a positive amount", () => {
    const malformed = event() as Stripe.Event & {
      data: { object: { amount_total: number } };
    };
    malformed.data.object.amount_total = 0;
    expect(() => parseStripeCheckoutEvent(malformed)).toThrow();
  });
});
