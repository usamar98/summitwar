import type Stripe from "stripe";
import { z } from "zod";

const paidSessionSchema = z.object({
  id: z.string().min(1),
  mode: z.literal("payment"),
  payment_status: z.literal("paid"),
  amount_total: z.number().int().positive(),
  currency: z.string().length(3),
  client_reference_id: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.string()).nullable(),
  payment_intent: z.union([
    z.string().min(1),
    z.object({ id: z.string().min(1) }),
  ]),
  customer_email: z.string().email().nullable(),
  customer_details: z
    .object({ email: z.string().email().nullable() })
    .nullable(),
});

export type ParsedStripeCheckoutEvent =
  | { kind: "ignored" }
  | { kind: "pending" }
  | {
      kind: "paid";
      paymentId: string;
      providerPaymentId: string;
      amountCents: number;
      currency: string;
      email: string | null;
      occurredAt: string;
    };

export function parseStripeCheckoutEvent(
  event: Stripe.Event,
): ParsedStripeCheckoutEvent {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  )
    return { kind: "ignored" };

  const checkout = event.data.object as Stripe.Checkout.Session;
  if (checkout.payment_status !== "paid") return { kind: "pending" };

  const session = paidSessionSchema.parse(checkout);
  const paymentId =
    session.metadata?.summitwar_payment_id ?? session.client_reference_id;
  if (!paymentId) throw new Error("Missing SummitWar payment reference");

  return {
    kind: "paid",
    paymentId,
    providerPaymentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id,
    amountCents: session.amount_total,
    currency: session.currency,
    email: session.customer_details?.email ?? session.customer_email,
    occurredAt: new Date(event.created * 1000).toISOString(),
  };
}
