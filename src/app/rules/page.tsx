import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "The complete transparent ranking, payment, and avalanche rules for SummitWar.",
};
const rules = [
  [
    "One dollar, one hundred metres",
    "Payments use whole US-dollar amounts and are stored as integer cents. The minimum new listing and top-up is $1.",
  ],
  [
    "The highest verified total wins",
    "Rank is current-season cumulative spend, descending. If totals are equal, whoever reached that total first stays higher.",
  ],
  [
    "Checkout never reserves rank",
    "We show the exact difference plus $1 when a quote is calculated, but another startup can move while checkout is open. Your verified payment still applies and receives its actual live rank.",
  ],
  [
    "Webhooks move flags",
    "The browser and success redirect never change altitude. Only a correctly signed Stripe paid Checkout webhook can credit a payment, and duplicate delivery cannot credit twice.",
  ],
  [
    "Monday is avalanche day",
    "Every Monday at 00:00 UTC a new season begins. Seasonal altitude returns to zero; profiles, lifetime spend, clicks, summit wins, achievements, and Hall of Fame records remain.",
  ],
  [
    "Sponsored and normally non-refundable",
    "All placements are paid sponsorships, not votes, reviews, or editorial recommendations. Payments are normally non-refundable, and rankings can change at any time.",
  ],
  [
    "Fifty flags on the mountain",
    "Only the top 50 approved startups appear on the mountain. Every other approved listing remains searchable in Base Camp.",
  ],
  [
    "Fair play",
    "Automated click inflation, deceptive listings, unsafe destinations, prohibited content, or attempts to manipulate the platform can lead to suspension without changing the verified-revenue ledger.",
  ],
];
export default function RulesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
      <Badge variant="outline" className="border-primary/30 text-primary">
        Transparent by design
      </Badge>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
        The rules of the mountain
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
        No hidden score, no hand-tuned placement, no ambiguous tie-break. Every
        material ranking rule is public.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {rules.map(([title, body], index) => (
          <Card key={title}>
            <CardContent className="p-6">
              <div className="font-mono text-xs text-primary">
                RULE {String(index + 1).padStart(2, "0")}
              </div>
              <h2 className="mt-3 text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
