import { Activity, Flag, MountainSnow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RankingEvent } from "@/lib/types";

export function ActivityFeed({
  events,
  limit,
}: {
  events: RankingEvent[];
  limit?: number;
}) {
  const visible = typeof limit === "number" ? events.slice(0, limit) : events;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-accent" /> Live activity
        </CardTitle>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.16em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" /> immutable ledger
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {visible.length ? (
          <ol className="divide-y divide-border">
            {visible.map((event) => (
              <li key={event.id} className="flex gap-3 px-6 py-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-primary">
                  {event.type === "season_started" ? (
                    <MountainSnow className="size-4" />
                  ) : (
                    <Flag className="size-4" />
                  )}
                </span>
                <div>
                  <p className="text-sm leading-6">{event.message}</p>
                  <time
                    className="mt-1 block text-[11px] text-muted-foreground"
                    dateTime={event.createdAt}
                  >
                    {new Date(event.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "UTC",
                      timeZoneName: "short",
                    })}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No verified climbs yet. The first payment will write the first
            event.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
