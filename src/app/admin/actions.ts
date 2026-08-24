"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getStripeClient } from "@/lib/payments/stripe";
import { sanitizePlainText } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

async function audit(
  admin: { id: string; email: string },
  action: string,
  targetType: string,
  targetId: string | null,
  before: unknown,
  after: unknown,
) {
  const supabase = createAdminClient();
  await supabase.from("admin_audit_log").insert({
    admin_id: admin.id,
    admin_email: admin.email,
    action,
    target_type: targetType,
    target_id: targetId,
    before_data: before,
    after_data: after,
  });
}

export async function moderateListingAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({
      listingId: z.string().uuid(),
      status: z.enum(["approved", "hidden", "suspended", "pending_review"]),
    })
    .parse(Object.fromEntries(formData));
  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from("listings")
    .select("id,status")
    .eq("id", input.listingId)
    .single();
  const { error } = await supabase
    .from("listings")
    .update({
      status: input.status,
      approved_at:
        input.status === "approved" ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.listingId);
  if (error) throw new Error("Moderation update failed");
  await audit(
    admin,
    `listing.${input.status}`,
    "listing",
    input.listingId,
    before,
    { status: input.status },
  );
  revalidatePath("/admin");
}

export async function adminEditListingAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({
      listingId: z.string().uuid(),
      name: z.string().min(1).max(80),
      tagline: z.string().max(160),
      category: z.string().min(1).max(64),
    })
    .parse(Object.fromEntries(formData));
  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from("listings")
    .select("name,tagline,category")
    .eq("id", input.listingId)
    .single();
  const after = {
    name: sanitizePlainText(input.name, 80),
    tagline: sanitizePlainText(input.tagline, 160),
    category: sanitizePlainText(input.category, 64),
  };
  const { error } = await supabase
    .from("listings")
    .update({ ...after, updated_at: new Date().toISOString() })
    .eq("id", input.listingId);
  if (error) throw new Error("Listing update failed");
  await audit(admin, "listing.edit", "listing", input.listingId, before, after);
  revalidatePath("/admin");
}

export async function rotateSeasonAction() {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("rotate_weekly_season", {
    p_now: new Date().toISOString(),
  });
  if (error) throw new Error("Season rotation failed");
  await audit(admin, "season.rotate", "season", null, null, data);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createTestimonialAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = z
    .object({
      quote: z.string().min(5).max(600),
      founderName: z.string().min(1).max(100),
      startupName: z.string().min(1).max(100),
      founderHandle: z.string().max(32).optional(),
    })
    .parse(Object.fromEntries(formData));
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .insert({
      quote: sanitizePlainText(input.quote, 600),
      founder_name: sanitizePlainText(input.founderName, 100),
      startup_name: sanitizePlainText(input.startupName, 100),
      founder_x_handle: input.founderHandle,
      is_published: true,
    })
    .select("id")
    .single();
  if (error) throw new Error("Testimonial creation failed");
  await audit(
    admin,
    "testimonial.publish",
    "testimonial",
    data.id,
    null,
    input,
  );
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateMinimumBidAction(formData: FormData) {
  const admin = await requireAdmin();
  const dollars = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .parse(formData.get("minimumBidDollars"));
  const supabase = createAdminClient();
  const { data: before } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "minimum_bid_cents")
    .single();
  const cents = dollars * 100;
  await supabase.from("site_settings").upsert({
    key: "minimum_bid_cents",
    value: cents,
    is_public: true,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  });
  await audit(
    admin,
    "settings.minimum_bid",
    "site_setting",
    "minimum_bid_cents",
    before,
    { value: cents },
  );
  revalidatePath("/admin");
}

export async function replayPaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  const paymentId = z.string().uuid().parse(formData.get("paymentId"));
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("Stripe is not configured");
  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id,provider,provider_checkout_id,provider_payment_id")
    .eq("id", paymentId)
    .single();
  if (!payment) throw new Error("Payment was not found");
  if (payment.provider !== "stripe")
    throw new Error("Only Stripe payments can be replayed");
  const stripe = getStripeClient();
  let remote: Stripe.PaymentIntent | null = payment.provider_payment_id
    ? await stripe.paymentIntents.retrieve(payment.provider_payment_id)
    : null;
  if (!remote && payment.provider_checkout_id) {
    const session = await stripe.checkout.sessions.retrieve(
      payment.provider_checkout_id,
      { expand: ["payment_intent"] },
    );
    if (session.payment_status !== "paid")
      throw new Error("Stripe does not report this Checkout as paid");
    remote =
      typeof session.payment_intent === "string"
        ? await stripe.paymentIntents.retrieve(session.payment_intent)
        : session.payment_intent;
  }
  if (!remote) throw new Error("Payment has no Stripe payment reference");
  if (remote.status !== "succeeded")
    throw new Error("Provider does not report this payment as succeeded");
  if (remote.metadata.summitwar_payment_id !== payment.id)
    throw new Error("Stripe metadata does not match this payment");
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        id: remote.id,
        amount: remote.amount_received,
        currency: remote.currency,
      }),
    )
    .digest("hex");
  const { data, error } = await supabase.rpc("apply_verified_payment", {
    p_provider_event_id: `${remote.id}:admin-replay`,
    p_provider_payment_id: remote.id,
    p_payment_id: payment.id,
    p_amount_cents: remote.amount_received,
    p_currency: remote.currency,
    p_payload_digest: digest,
    p_occurred_at: new Date(remote.created * 1000).toISOString(),
  });
  if (error) throw new Error("Idempotent replay failed");
  await audit(admin, "webhook.replay", "payment", paymentId, null, data);
  revalidatePath("/admin");
}
