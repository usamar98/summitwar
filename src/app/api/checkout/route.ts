import { NextResponse } from "next/server";
import { checkoutSchema, slugify } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import { demoStartups } from "@/lib/demo-data";
import { amountToOvertakeCents } from "@/lib/domain/ranking";

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid checkout request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  const input = parsed.data;
  const amountCents = input.amountDollars * 100;

  if (!hasAdminSupabaseEnv()) {
    if (process.env.NODE_ENV === "production")
      return NextResponse.json(
        { error: "Payments are not configured" },
        { status: 503 },
      );
    const demo = demoStartups.find((item) => item.id === input.listingId);
    const result = await getPaymentProvider({
      forceDevelopment: true,
    }).createCheckout({
      paymentId: crypto.randomUUID(),
      listingId: input.listingId ?? crypto.randomUUID(),
      startupName: input.listing?.name ?? demo?.name ?? "New startup",
      amountCents,
      email: input.email,
    });
    return NextResponse.json({ ...result, demo: true });
  }

  const supabase = createAdminClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "active")
    .maybeSingle();
  if (!season)
    return NextResponse.json(
      { error: "The next season is being prepared. Try again shortly." },
      { status: 409 },
    );

  let listingId = input.listingId;
  let startupName = input.listing?.name ?? "Startup";
  if (listingId) {
    const { data: listing } = await supabase
      .from("listings")
      .select("id,name,status,current_season_spend_cents")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing || listing.status === "suspended")
      return NextResponse.json(
        { error: "Listing cannot accept climbs" },
        { status: 404 },
      );
    startupName = listing.name;
  } else if (input.listing) {
    const slug = `${slugify(input.listing.name)}-${crypto.randomUUID().slice(0, 6)}`;
    const { data: created, error } = await supabase
      .from("listings")
      .insert({
        slug,
        name: input.listing.name,
        tagline: input.listing.tagline,
        description: input.listing.description,
        website_url: input.listing.website,
        normalized_url: input.listing.website,
        founder_name: input.listing.founderName,
        founder_x_handle: input.listing.founderHandle,
        category: input.listing.category,
        launch_year: input.listing.launchYear,
        current_season_id: season.id,
      })
      .select("id,name")
      .single();
    if (error || !created)
      return NextResponse.json(
        {
          error:
            error?.code === "23505"
              ? "This website is already listed"
              : "Could not create listing",
        },
        { status: 409 },
      );
    listingId = created.id;
    startupName = created.name;
  }
  if (!listingId)
    return NextResponse.json({ error: "Missing listing" }, { status: 400 });

  const { data: ranked } = await supabase
    .from("listings")
    .select("id,current_season_spend_cents,current_rank")
    .eq("status", "approved")
    .order("current_rank");
  const own = ranked?.find((item) => item.id === listingId);
  const ownSpend = Number(own?.current_season_spend_cents ?? 0);
  const target =
    input.target === "summit"
      ? ranked?.[0]
      : input.target === "next" && own?.current_rank && own.current_rank > 1
        ? ranked?.[own.current_rank - 2]
        : null;
  const quotedMinimum = target
    ? amountToOvertakeCents(ownSpend, Number(target.current_season_spend_cents))
    : 100;
  if (input.target !== "custom" && amountCents < quotedMinimum)
    return NextResponse.json(
      {
        error: "Ranking changed. Refresh the quote and try again.",
        quotedMinimumCents: quotedMinimum,
      },
      { status: 409 },
    );

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      listing_id: listingId,
      season_id: season.id,
      provider: "stripe",
      payer_email: input.email,
      amount_cents: amountCents,
      requested_rank: target?.current_rank ?? null,
      quote_snapshot: {
        target: input.target,
        quoted_minimum_cents: quotedMinimum,
        calculated_at: new Date().toISOString(),
      },
    })
    .select("id")
    .single();
  if (paymentError || !payment)
    return NextResponse.json(
      { error: "Could not initialize payment" },
      { status: 500 },
    );

  try {
    const result = await getPaymentProvider().createCheckout({
      paymentId: payment.id,
      listingId,
      startupName,
      amountCents,
      email: input.email,
    });
    await supabase
      .from("payments")
      .update({ provider_checkout_id: result.providerCheckoutId })
      .eq("id", payment.id);
    return NextResponse.json(result);
  } catch (error) {
    await supabase
      .from("payments")
      .update({ status: "failed", failure_code: "checkout_creation_failed" })
      .eq("id", payment.id);
    console.error(
      JSON.stringify({
        event: "checkout.creation_failed",
        paymentId: payment.id,
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
    return NextResponse.json(
      { error: "Checkout could not be opened. No payment was taken." },
      { status: 502 },
    );
  }
}
