import { createHash } from "node:crypto";
import { Webhooks } from "@dodopayments/nextjs";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/email/send";

const successfulPaymentSchema = z.object({
  type: z.literal("payment.succeeded"),
  timestamp: z.coerce.date(),
  data: z.object({
    payment_id: z.string().min(1),
    total_amount: z.number().int().positive(),
    currency: z.string().min(3).max(3),
    metadata: z.record(z.string(), z.unknown()),
    customer: z.object({ email: z.string().email() }),
  }),
});

async function handleSuccessfulPayment(payload: unknown) {
  const event = successfulPaymentSchema.parse(payload);
  const paymentId = String(event.data.metadata.summitwar_payment_id ?? "");
  if (!paymentId) throw new Error("Missing SummitWar payment reference");
  const eventId = `${event.data.payment_id}:succeeded`;
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        eventId,
        amount: event.data.total_amount,
        currency: event.data.currency,
        paymentId,
      }),
    )
    .digest("hex");
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("apply_verified_payment", {
    p_provider_event_id: eventId,
    p_provider_payment_id: event.data.payment_id,
    p_payment_id: paymentId,
    p_amount_cents: event.data.total_amount,
    p_currency: event.data.currency,
    p_payload_digest: digest,
    p_occurred_at: event.timestamp.toISOString(),
  });
  if (error) throw new Error(`Payment transaction failed: ${error.message}`);
  const result = data as {
    duplicate?: boolean;
    new_rank?: number;
    old_rank?: number | null;
    displaced_listing_id?: string | null;
  } | null;
  if (!result?.duplicate) {
    await sendTransactionalEmail({
      to: event.data.customer.email,
      subject:
        result?.new_rank === 1
          ? "You captured the SummitWar summit"
          : result?.old_rank == null
            ? "Your startup is live on SummitWar"
            : "Your SummitWar climb is verified",
      text: `Your payment was verified and applied atomically. Your actual rank is #${result?.new_rank ?? "pending"}. Rankings may continue to change.`,
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
  }
}

export async function POST(request: NextRequest) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!webhookKey)
    return Response.json(
      { error: "Webhook is not configured" },
      { status: 503 },
    );
  return Webhooks({ webhookKey, onPaymentSucceeded: handleSuccessfulPayment })(
    request,
  );
}
