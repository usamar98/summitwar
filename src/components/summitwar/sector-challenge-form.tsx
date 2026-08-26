"use client";

import { useId, useState } from "react";
import { Flag, Loader2, ShieldCheck, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CheckoutResponse = {
  checkoutUrl?: string;
  error?: string;
};

export function SectorChallengeForm({
  startupId,
  startupName,
  rank,
  buttonLabel,
}: {
  startupId: string;
  startupName: string;
  rank: number;
  buttonLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceId = useId().replaceAll(":", "");
  const fieldId = `sector-${startupId}-${instanceId}`;

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeListingId: startupId,
          email: formData.get("email"),
          quickListing: {
            name: formData.get("name"),
            website: formData.get("website"),
            founderHandle: formData.get("founderHandle"),
          },
        }),
      });
      const result = (await response.json()) as CheckoutResponse;
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error ?? "Checkout could not be opened");
      }
      window.location.assign(result.checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
      setPending(false);
    }
  }

  return (
    <form
      action={submit}
      aria-label={`Challenge ${startupName} in sector ${rank}`}
      className="relative mt-4 grid gap-3"
    >
      <ChallengeField
        id={`${fieldId}-name`}
        label="Project name"
        name="name"
        autoComplete="organization"
        maxLength={80}
        placeholder="Your project"
      />
      <ChallengeField
        id={`${fieldId}-website`}
        label="Project link"
        name="website"
        type="url"
        autoComplete="url"
        placeholder="https://yourproject.com"
      />
      <ChallengeField
        id={`${fieldId}-handle`}
        label="X handle"
        optional
        name="founderHandle"
        maxLength={32}
        placeholder="@yourproject"
      />
      <ChallengeField
        id={`${fieldId}-email`}
        label="Checkout email"
        name="email"
        type="email"
        autoComplete="email"
        maxLength={320}
        placeholder="you@company.com"
      />
      {error ? (
        <p role="alert" className="text-[10px] leading-4 text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className={`mt-1 min-h-11 w-full rounded-xl text-xs ${
          rank === 1
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-accent text-accent-foreground hover:bg-accent/90"
        }`}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Flag className="size-3.5" />
        )}
        {pending
          ? "Opening secure checkout…"
          : (buttonLabel ?? `Challenge sector #${rank} with your project`)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[9px] text-muted-foreground">
        <ShieldCheck className="size-3 text-accent" /> Stripe checkout · exact
        takeover amount calculated live
      </p>
    </form>
  );
}

export function KnockDownChallengeDialog({
  startupId,
  startupName,
  rank,
}: {
  startupId: string;
  startupName: string;
  rank: number;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="xs"
          variant="outline"
          className="border-accent/25 bg-accent/8 text-accent hover:border-accent/45 hover:bg-accent/15"
          aria-label={`Knock down ${startupName}`}
        >
          <TrendingDown /> Knock Down
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#0d0e12] p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Knock down {startupName}
          </DialogTitle>
          <DialogDescription className="leading-6">
            Enter your project details. Stripe calculates the exact verified
            amount needed to move above rank #{rank}.
          </DialogDescription>
        </DialogHeader>
        <SectorChallengeForm
          startupId={startupId}
          startupName={startupName}
          rank={rank}
          buttonLabel={`Knock down ${startupName}`}
        />
      </DialogContent>
    </Dialog>
  );
}

function ChallengeField({
  id,
  label,
  optional = false,
  ...props
}: {
  id: string;
  label: string;
  optional?: boolean;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-1.5">
      <Label
        htmlFor={id}
        className="text-[9px] font-medium uppercase tracking-[.15em] text-muted-foreground"
      >
        {label}
        {optional ? (
          <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">
            (optional)
          </span>
        ) : null}
      </Label>
      <Input
        id={id}
        required={!optional}
        className="h-10 rounded-xl border-white/10 bg-black/30 px-3 text-xs"
        {...props}
      />
    </div>
  );
}
