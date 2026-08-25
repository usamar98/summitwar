import { NextResponse } from "next/server";
import { checkoutSchema, slugify } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments/provider";
import { createAdminClient, hasAdminSupabaseEnv } from "@/lib/supabase/admin";
import { demoStartups } from "@/lib/demo-data";
import { amountToOvertakeCents } from "@/lib/domain/ranking";
import {
  fetchProjectFaviconAsset,
  fetchProjectMetadata,
  type ProjectFaviconAsset,
} from "@/lib/project-metadata";

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
  const submittedListing = input.quickListing ?? input.listing;
  let amountCents = (input.amountDollars ?? 0) * 100;

  if (!hasAdminSupabaseEnv()) {
    if (process.env.NODE_ENV === "production")
      return NextResponse.json(
        { error: "Payments are not configured" },
        { status: 503 },
      );
    const demo = demoStartups.find((item) => item.id === input.listingId);
    const challenged = demoStartups.find(
      (item) => item.id === input.challengeListingId,
    );
    if (input.quickListing) {
      if (!challenged)
        return NextResponse.json(
          { error: "This project sector is no longer available" },
          { status: 409 },
        );
      amountCents = amountToOvertakeCents(0, challenged.seasonSpendCents);
    }
    const result = await getPaymentProvider({
      forceDevelopment: true,
    }).createCheckout({
      paymentId: crypto.randomUUID(),
      listingId: input.listingId ?? crypto.randomUUID(),
      startupName: submittedListing?.name ?? demo?.name ?? "New startup",
      amountCents,
      email: input.email,
    });
    return NextResponse.json({ ...result, demo: true });
  }

  const supabase = createAdminClient();
  const seasonPromise = supabase
    .from("seasons")
    .select("id")
    .eq("status", "active")
    .maybeSingle();
  const metadataPromise = input.listing
    ? fetchProjectMetadata(input.listing.website)
    : input.quickListing
      ? fetchProjectMetadata(input.quickListing.website)
      : Promise.resolve({ heading: null, faviconUrls: [] });
  const challengePromise = input.challengeListingId
    ? supabase
        .from("listings")
        .select("id,status")
        .eq("id", input.challengeListingId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [{ data: season }, projectMetadata, { data: challengedListing }] =
    await Promise.all([seasonPromise, metadataPromise, challengePromise]);
  if (!season)
    return NextResponse.json(
      { error: "The next season is being prepared. Try again shortly." },
      { status: 409 },
    );
  if (
    input.quickListing &&
    (!challengedListing || challengedListing.status !== "approved")
  )
    return NextResponse.json(
      { error: "This project sector is no longer available" },
      { status: 409 },
    );

  let listingId = input.listingId;
  let startupName = submittedListing?.name ?? "Startup";
  let faviconImport: Promise<ProjectFaviconAsset | null> | null = null;
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
  } else if (submittedListing) {
    const heading =
      projectMetadata.heading ??
      (input.listing ? input.listing.tagline : submittedListing.name);
    const slug = `${slugify(submittedListing.name)}-${crypto.randomUUID().slice(0, 6)}`;
    const { data: created, error } = await supabase
      .from("listings")
      .insert({
        slug,
        name: submittedListing.name,
        tagline: heading,
        description: input.listing
          ? input.listing.description
          : heading || `${submittedListing.name} is competing on SummitWar.`,
        website_url: submittedListing.website,
        normalized_url: submittedListing.website,
        founder_name: input.listing
          ? input.listing.founderName
          : input.quickListing?.founderHandle ||
            `${submittedListing.name} team`,
        founder_x_handle: submittedListing.founderHandle,
        category: input.listing ? input.listing.category : "Project",
        launch_year: input.listing
          ? input.listing.launchYear
          : new Date().getUTCFullYear(),
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
    if (projectMetadata.faviconUrls.length) {
      faviconImport = fetchProjectFaviconAsset(projectMetadata.faviconUrls);
    }
  }
  if (!listingId)
    return NextResponse.json({ error: "Missing listing" }, { status: 400 });

  const [{ data: ranked }, faviconAsset] = await Promise.all([
    supabase
      .from("listings")
      .select("id,current_season_spend_cents,current_rank")
      .eq("status", "approved")
      .order("current_rank"),
    faviconImport ?? Promise.resolve(null),
  ]);
  if (faviconAsset) {
    const logoPath = `${listingId}/favicon-${crypto.randomUUID()}.${faviconAsset.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("startup-logos")
      .upload(logoPath, faviconAsset.bytes, {
        contentType: faviconAsset.contentType,
        upsert: false,
      });
    if (!uploadError) {
      const logoUrl = supabase.storage
        .from("startup-logos")
        .getPublicUrl(logoPath).data.publicUrl;
      await supabase
        .from("listings")
        .update({ logo_path: logoPath, logo_url: logoUrl })
        .eq("id", listingId);
    }
  }
  const own = ranked?.find((item) => item.id === listingId);
  const ownSpend = Number(own?.current_season_spend_cents ?? 0);
  const target = input.quickListing
    ? ranked?.find((item) => item.id === input.challengeListingId)
    : input.target === "summit"
      ? ranked?.[0]
      : input.target === "next" && own?.current_rank && own.current_rank > 1
        ? ranked?.[own.current_rank - 2]
        : null;
  if (input.quickListing && !target)
    return NextResponse.json(
      { error: "This project sector changed. Try another sector." },
      { status: 409 },
    );
  const quotedMinimum = target
    ? amountToOvertakeCents(ownSpend, Number(target.current_season_spend_cents))
    : 100;
  if (input.quickListing) amountCents = quotedMinimum;
  if (amountCents > 100_000 * 100)
    return NextResponse.json(
      { error: "This sector exceeds the maximum checkout amount" },
      { status: 409 },
    );
  if (
    !input.quickListing &&
    input.target !== "custom" &&
    amountCents < quotedMinimum
  )
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
        target: input.quickListing ? "challenge" : input.target,
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
