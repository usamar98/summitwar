import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { sendTransactionalEmail } from "@/lib/email/send";
import { parseStripeCheckoutEvent } from "@/lib/payments/stripe-events";
import { getStripeClient } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaymentResult = {
  duplicate?: boolean;
  new_rank?: number;
  old_rank?: number | null;
  displaced_listing_id?: string | null;
} | null;

async function sendPaymentNotifications(
  paymentId: string,
  email: string | null,
  result: PaymentResult,
) {
  try {
    const supabase = createAdminClient();
    if (email)
      await sendTransactionalEmail({
        to: email,
        subject:
          result?.new_rank === 1
            ? "You captured the SummitWar summit"
            : result?.old_rank == null
              ? "Your startup is live on SummitWar"
              : "Your SummitWar climb is verified",
        text: `Your Stripe payment was verified and applied atomically. Your actual rank is #${result?.new_rank ?? "pending"}. Rankings may continue to change.`,
      });
    if (result?.displaced_listing_id) {
      const { data: contacts } = await supabase
        .from("listing_contacts")
        .select("email,owner_id")
        .eq("listing_id", result.displaced_listing_id);
      for (const contact of contacts ?? []) {
        let enabled = true;
        if (contact.owner_id) {
          const { data: preference } = await supabase
            .from("notification_preferences")
            .select("overtaken")
            .eq("owner_id", contact.owner_id)
            .maybeSingle();
          enabled = preference?.overtaken ?? true;
        }
        if (enabled)
          await sendTransactionalEmail({
            to: contact.email,
            subject: "Your startup was overtaken on SummitWar",
            text: "Another verified climb captured the summit. Your listing and lifetime history remain, and you can reclaim the summit at any time.",
          });
      }
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "payment.notification_failed",
        paymentId,
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
  }
}

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
  if (!result?.duplicate)
    await sendPaymentNotifications(checkout.paymentId, checkout.email, result);

  return Response.json({
    received: true,
    duplicate: Boolean(result?.duplicate),
  });
}
