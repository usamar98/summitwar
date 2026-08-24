import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { parseStripeCheckoutEvent } from "@/lib/payments/stripe-events";
import { getStripeClient } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaymentResult = {
  duplicate?: boolean;
} | null;

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret)
    return Response.json(
      { error: "Webhook is not configured" },
      { status: 503 },
    );
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return Response.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json(
      { error: "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  let checkout;
  try {
    checkout = parseStripeCheckoutEvent(event);
  } catch {
    return Response.json(
      { error: "Invalid paid Checkout Session" },
      { status: 400 },
    );
  }
  if (checkout.kind === "ignored")
    return Response.json({ received: true, ignored: true });
  if (checkout.kind === "pending")
    return Response.json({ received: true, pending: true });

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("apply_verified_payment", {
    p_provider_event_id: event.id,
    p_provider_payment_id: checkout.providerPaymentId,
    p_payment_id: checkout.paymentId,
    p_amount_cents: checkout.amountCents,
    p_currency: checkout.currency,
    p_payload_digest: createHash("sha256").update(rawBody).digest("hex"),
    p_occurred_at: checkout.occurredAt,
  });
  if (error) {
    console.error(
      JSON.stringify({
        event: "payment.transaction_failed",
        providerEventId: event.id,
        message: error.message,
      }),
    );
    return Response.json(
      { error: "Payment transaction failed" },
      { status: 500 },
    );
  }

  const result = data as PaymentResult;
  return Response.json({
    received: true,
    duplicate: Boolean(result?.duplicate),
  });
}
