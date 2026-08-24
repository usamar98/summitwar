"use server";

import { createHash } from "node:crypto";
import DodoPayments from "dodopayments";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
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
  if (!process.env.DODO_PAYMENTS_API_KEY)
    throw new Error("Dodo Payments is not configured");
  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id,provider_payment_id")
    .eq("id", paymentId)
    .single();
  if (!payment?.provider_payment_id)
    throw new Error("Payment has no provider ID");
  const dodo = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment:
      process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
        ? "test_mode"
        : "live_mode",
  });
  const remote = await dodo.payments.retrieve(payment.provider_payment_id);
  if (remote.status !== "succeeded")
    throw new Error("Provider does not report this payment as succeeded");
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        id: remote.payment_id,
        amount: remote.total_amount,
        currency: remote.currency,
      }),
    )
    .digest("hex");
  const { data, error } = await supabase.rpc("apply_verified_payment", {
    p_provider_event_id: `${remote.payment_id}:admin-replay`,
    p_provider_payment_id: remote.payment_id,
    p_payment_id: payment.id,
    p_amount_cents: remote.total_amount,
    p_currency: remote.currency,
    p_payload_digest: digest,
    p_occurred_at: remote.created_at,
  });
  if (error) throw new Error("Idempotent replay failed");
  await audit(admin, "webhook.replay", "payment", paymentId, null, data);
  revalidatePath("/admin");
}
