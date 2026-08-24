import type { Metadata } from "next";
import { ActivityFeed } from "@/components/summitwar/activity-feed";
import { Badge } from "@/components/ui/badge";
import { getHomeData } from "@/lib/data";

export const metadata: Metadata = {
  title: "Activity",
  description:
    "The immutable live ledger of SummitWar climbs and summit takeovers.",
};
export default async function ActivityPage() {
  const { events, demo } = await getHomeData();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="mb-8">
        <div className="flex gap-2">
          <Badge variant="outline" className="border-accent/25 text-accent">
            Verified events
          </Badge>
          {demo ? (
            <Badge className="bg-primary/10 text-primary">Demo data</Badge>
          ) : null}
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          The climb ledger
        </h1>
        <p className="mt-3 text-muted-foreground">
          Events are written by atomic payment and season transactions. They
          cannot be edited or deleted.
        </p>
      </div>
      <ActivityFeed events={events} />
    </div>
  );
}
