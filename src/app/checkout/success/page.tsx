import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Checkout received",
  robots: { index: false, follow: false },
};
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <Card className="border-primary/20">
        <CardContent className="p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            {demo ? (
              <Clock3 className="size-6" />
            ) : (
              <CheckCircle2 className="size-6" />
            )}
          </span>
          <Badge className="mt-6 bg-primary/10 text-primary">
            {demo ? "Development adapter" : "Checkout complete"}
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {demo
              ? "Test checkout created—no money moved."
              : "Your climb is being verified."}
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {demo
              ? "The development fallback never changes altitude. Configure Dodo Payments and forward a signed test-mode webhook to exercise the production transaction."
              : "The success redirect cannot move your flag. Dodo Payments will send a signed webhook; once verified, the atomic ranking transaction applies your climb and emails your actual rank."}
          </p>
          <Alert className="mt-7 text-left">
            <Clock3 />
            <AlertTitle>Webhook delay is normal</AlertTitle>
            <AlertDescription>
              It may take a short moment for the leaderboard and management
              email to update. Refreshing this page cannot duplicate the climb.
            </AlertDescription>
          </Alert>
          <div className="mt-7 flex justify-center gap-3">
            <Button asChild>
              <Link href="/">Watch the mountain</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Owner login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
