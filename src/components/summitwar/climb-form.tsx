"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";
import { StartupMark } from "@/components/summitwar/startup-mark";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";

type CheckoutResponse = {
  checkoutUrl?: string;
  error?: string;
  quotedMinimumCents?: number;
};

type ProjectPreview = {
  heading: string | null;
  logoDataUrl: string | null;
};

async function beginCheckout(payload: Record<string, unknown>) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as CheckoutResponse;
  if (!response.ok || !result.checkoutUrl)
    throw new Error(result.error ?? "Checkout could not be opened");
  window.location.assign(result.checkoutUrl);
}

export function NewListingForm({
  compact = false,
  onCancel,
}: {
  compact?: boolean;
  onCancel?: () => void;
} = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [website, setWebsite] = useState("");
  const [tagline, setTagline] = useState("");
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const taglineEdited = useRef(false);

  useEffect(() => {
    const link = website.trim();
    if (!link || !link.includes(".")) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewing(true);
      try {
        const response = await fetch("/api/project-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ website: link }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Preview unavailable");
        const result = (await response.json()) as ProjectPreview;
        setPreview(result);
        if (result.heading && !taglineEdited.current) {
          setTagline(result.heading);
        }
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setPreview(null);
        }
      } finally {
        if (!controller.signal.aborted) setPreviewing(false);
      }
    }, 550);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [website]);
  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await beginCheckout({
        email: formData.get("email"),
        amountDollars: formData.get("amount"),
        target: "custom",
        listing: {
          name: formData.get("name"),
          tagline: formData.get("tagline"),
          description: formData.get("description"),
          website: formData.get("website"),
          founderName: formData.get("founderName"),
          founderHandle: formData.get("founderHandle"),
          category: formData.get("category"),
          launchYear: formData.get("launchYear"),
        },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
      setPending(false);
    }
  }
  return (
    <Card
      className={`border-primary/15 ${compact ? "xl:max-h-[660px] xl:overflow-y-auto" : ""}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Plant a new flag</CardTitle>
          <Badge className="bg-primary/10 text-primary">From $1</Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          No account required. Use your checkout email later to access the owner
          dashboard.
        </p>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit px-0 text-muted-foreground"
            onClick={onCancel}
          >
            <ArrowLeft /> Back to summit details
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <form action={submit} className={`grid ${compact ? "gap-4" : "gap-5"}`}>
          <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
            <Field
              label="Project name"
              name="name"
              placeholder="Acme Labs"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
            />
            <Field
              label="Project link"
              name="website"
              placeholder="acme.com"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
            <Field
              label="Founder name"
              name="founderName"
              placeholder="Ada Founder"
            />
            <Field label="X handle" name="founderHandle" placeholder="@ada" />
            <Field
              label="Category"
              name="category"
              placeholder="Developer tools"
            />
            <Field
              label="Launch year"
              name="launchYear"
              type="number"
              defaultValue={String(new Date().getFullYear())}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tagline">Project heading fallback</Label>
            <Input
              id="tagline"
              name="tagline"
              required
              maxLength={160}
              value={tagline}
              onChange={(event) => {
                taglineEdited.current = true;
                setTagline(event.target.value);
              }}
              placeholder="Used only when your website has no project description."
            />
            <p className="text-[11px] leading-4 text-muted-foreground">
              We automatically fetch your website&apos;s project heading and
              logo when the listing is created.
            </p>
          </div>
          {previewing || preview ? (
            <div
              aria-live="polite"
              className="rounded-xl border border-accent/18 bg-accent/[.045] p-3"
            >
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[.14em] text-accent">
                {previewing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ScanSearch className="size-3" />
                )}
                {previewing ? "Reading project link" : "Project detected"}
              </div>
              {preview ? (
                <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-background/45 p-3">
                  <StartupMark
                    name={projectName || "Project"}
                    logoUrl={preview.logoDataUrl}
                    className="size-10 rounded-lg"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {projectName || "Your project"}
                    </div>
                    <div className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                      {preview.heading ??
                        "The link is reachable; keep your fallback heading below."}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              minLength={20}
              maxLength={5000}
              rows={compact ? 3 : 5}
              placeholder="What are you building, for whom, and why does it matter?"
            />
          </div>
          <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
            <Field
              label="Checkout email"
              name="email"
              type="email"
              placeholder="founder@acme.com"
            />
            <Field
              label="Opening climb (whole USD)"
              name="amount"
              type="number"
              min="1"
              step="1"
              defaultValue="1"
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Could not open checkout</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Disclosure />
          <Button type="submit" size="lg" className="h-12" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}
            {pending ? "Opening secure checkout…" : "Continue to Stripe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required {...props} />
    </div>
  );
}
function Disclosure() {
  return (
    <Alert className="border-accent/20 bg-accent/5">
      <ShieldCheck className="text-accent" />
      <AlertTitle>Transparent sponsored placement</AlertTitle>
      <AlertDescription>
        Payments are normally non-refundable. Checkout does not reserve a rank;
        only the verified webhook applies the climb, and your actual resulting
        rank may differ.
      </AlertDescription>
    </Alert>
  );
}

export function ExistingClimbForm({
  listingId,
  startupName,
  nextCents,
  summitCents,
  initialDollars,
}: {
  listingId: string;
  startupName: string;
  nextCents: number;
  summitCents: number;
  initialDollars: number;
}) {
  const [target, setTarget] = useState("next");
  const [custom, setCustom] = useState(String(initialDollars || 1));
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount =
    target === "next"
      ? nextCents / 100
      : target === "summit"
        ? summitCents / 100
        : Number(custom);
  async function submit() {
    setPending(true);
    setError(null);
    try {
      await beginCheckout({ listingId, amountDollars: amount, email, target });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout failed");
      setPending(false);
    }
  }
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Move {startupName} higher</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a live quote or set a whole-dollar climb.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs value={target} onValueChange={setTarget}>
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="next" className="py-2.5">
              One position
            </TabsTrigger>
            <TabsTrigger value="summit" className="py-2.5">
              Take summit
            </TabsTrigger>
            <TabsTrigger value="custom" className="py-2.5">
              Custom
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="next"
            className="rounded-xl border bg-background/30 p-5"
          >
            <div className="text-sm text-muted-foreground">
              Minimum to pass the next startup
            </div>
            <div className="metric-number mt-2 text-3xl font-semibold">
              {formatMoney(nextCents)}
            </div>
          </TabsContent>
          <TabsContent
            value="summit"
            className="rounded-xl border border-primary/20 bg-primary/5 p-5"
          >
            <div className="text-sm text-muted-foreground">
              Minimum to take the summit now
            </div>
            <div className="metric-number mt-2 text-3xl font-semibold text-primary">
              {formatMoney(summitCents)}
            </div>
          </TabsContent>
          <TabsContent
            value="custom"
            className="rounded-xl border bg-background/30 p-5"
          >
            <Label htmlFor="custom-amount">Whole US dollars</Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-2 text-muted-foreground">
                $
              </span>
              <Input
                id="custom-amount"
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                type="number"
                min="1"
                step="1"
                className="pl-7"
              />
            </div>
          </TabsContent>
        </Tabs>
        <div className="grid gap-2">
          <Label htmlFor="climb-email">Email</Label>
          <Input
            id="climb-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="founder@startup.com"
          />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Quote changed or checkout failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Disclosure />
        <Button
          type="button"
          size="lg"
          onClick={submit}
          disabled={
            pending || !email || !Number.isInteger(amount) || amount < 1
          }
          className="h-12 w-full"
        >
          {pending ? <Loader2 className="animate-spin" /> : <ArrowUpRight />}
          {pending
            ? "Opening checkout…"
            : `Continue with ${formatMoney(amount * 100)}`}
        </Button>
      </CardContent>
    </Card>
  );
}
