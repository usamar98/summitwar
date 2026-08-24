"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto size-8 text-primary" />
          <h1 className="mt-5 text-2xl font-semibold">
            The trail disappeared in the snow.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            No payment or rank was changed by this display error. Try loading
            the route again.
          </p>
          <Button className="mt-6" onClick={retry}>
            <RefreshCw /> Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
