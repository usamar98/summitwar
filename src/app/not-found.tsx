import Link from "next/link";
import { Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Mountain className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-5 text-3xl font-semibold">
        That camp is not on this mountain.
      </h1>
      <p className="mt-3 text-muted-foreground">
        The listing may be pending review, hidden, suspended, or simply never
        existed.
      </p>
      <Button asChild className="mt-7">
        <Link href="/">Return to the mountain</Link>
      </Button>
    </div>
  );
}
