import type { Metadata } from "next";
import { ExistingClimbForm } from "@/components/summitwar/climb-form";
import { Badge } from "@/components/ui/badge";
import { getHomeData } from "@/lib/data";
import { amountToOvertakeCents } from "@/lib/domain/ranking";

export const metadata: Metadata = {
  title: "Climb",
  description: "Choose a transparent sponsored climb for your startup.",
};
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    listing?: string;
    amount?: string;
    cancelled?: string;
  }>;
}) {
  const query = await searchParams;
  const home = await getHomeData();
  const all = [...home.mountain, ...home.baseCamp];
  const startup = all.find((item) => item.id === query.listing);
  if (!startup)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Badge variant="outline">Listing not found</Badge>
        <h1 className="mt-5 text-3xl font-semibold">
          Choose a startup from the mountain first.
        </h1>
      </div>
    );
  const ordered = home.mountain;
  const index = ordered.findIndex((item) => item.id === startup.id);
  const next = index > 0 ? ordered[index - 1] : null;
  const summit = ordered[0];
  const nextCents = next
    ? amountToOvertakeCents(startup.seasonSpendCents, next.seasonSpendCents)
    : 100;
  const summitCents =
    summit && summit.id !== startup.id
      ? amountToOvertakeCents(startup.seasonSpendCents, summit.seasonSpendCents)
      : 100;
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.7fr_1fr] lg:px-10 lg:py-20">
      <div>
        <Badge variant="outline" className="border-accent/25 text-accent">
          Live quote
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          Every dollar is another 100 metres.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Quotes use the ranking visible right now. If someone else completes
          payment first, your climb still applies after verification and
          receives its actual position.
        </p>
        {query.cancelled ? (
          <p className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            Checkout was cancelled. Nothing was charged and the live rank did
            not change.
          </p>
        ) : null}
      </div>
      <ExistingClimbForm
        listingId={startup.id}
        startupName={startup.name}
        nextCents={nextCents}
        summitCents={summitCents}
        initialDollars={Number(query.amount ?? nextCents / 100)}
      />
    </div>
  );
}
