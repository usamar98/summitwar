import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { NewListingForm } from "@/components/summitwar/climb-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Start climbing",
  description:
    "List your startup and plant a sponsored flag on SummitWar from $1.",
};
export default function StartPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-10 lg:py-20">
      <div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          Plant your flag
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          Your first 100 metres start here.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Create the permanent profile now. Your flag goes live only after Dodo
          Payments sends a verified success webhook.
        </p>
        <ul className="mt-8 space-y-4 text-sm">
          {[
            "No account required before checkout",
            "Whole-dollar, one-time payments only",
            "Passwordless management link by email",
            "Listing and lifetime history survive every avalanche",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <NewListingForm />
    </div>
  );
}
