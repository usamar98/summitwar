import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Mail,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { getHomeData } from "@/lib/data";
import { formatMoney, formatNumber } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  adminEditListingAction,
  createTestimonialAction,
  moderateListingAction,
  replayPaymentAction,
  rotateSeasonAction,
  updateMinimumBidAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const admin = await requireAdmin();
  const query = await searchParams;
  const supabase = createAdminClient();
  let listingsQuery = supabase
    .from("listings")
    .select(
      "id,slug,name,tagline,category,status,current_rank,current_season_spend_cents,lifetime_spend_cents,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (query.q)
    listingsQuery = listingsQuery.ilike(
      "name",
      `%${query.q.replace(/[%_]/g, "")}%`,
    );
  if (query.status) listingsQuery = listingsQuery.eq("status", query.status);
  const [
    home,
    listings,
    payments,
    webhooks,
    seasons,
    testimonials,
    settings,
    audits,
  ] = await Promise.all([
    getHomeData(),
    listingsQuery,
    supabase
      .from("payments")
      .select(
        "id,listing_id,provider_checkout_id,provider_payment_id,status,amount_cents,verified,failure_code,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("webhook_events")
      .select(
        "id,provider_event_id,event_type,status,error_message,processed_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("seasons")
      .select("id,season_number,status,starts_at,ends_at,winning_spend_cents")
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase
      .from("testimonials")
      .select("id,quote,founder_name,startup_name,is_published,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("site_settings").select("key,value,is_public,updated_at"),
    supabase
      .from("admin_audit_log")
      .select("id,admin_email,action,target_type,target_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const minimum = Number(
    settings.data?.find((item) => item.key === "minimum_bid_cents")?.value ??
      100,
  );
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge className="bg-destructive/15 text-destructive">
            <ShieldCheck /> Admin allowlist
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Mountain control
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {admin.email}. Mutations write immutable audit records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/admin/export?kind=listings">
              <Download /> Listings CSV
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/admin/export?kind=payments">
              <Download /> Payments CSV
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/admin/export?kind=analytics">
              <Download /> Analytics CSV
            </a>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            [
              CircleDollarSign,
              "Verified revenue",
              formatMoney(home.stats.verifiedRevenueCents),
            ],
            [
              Activity,
              "Successful payments",
              formatNumber(home.stats.paymentCount),
            ],
            [Users, "Paid startups", formatNumber(home.stats.paidStartups)],
            [
              CheckCircle2,
              "Success rate",
              payments.data?.length
                ? `${Math.round((payments.data.filter((item) => item.status === "succeeded").length / payments.data.length) * 100)}%`
                : "—",
            ],
          ] as const
        ).map(([Icon, label, value]) => (
          <Card key={String(label)}>
            <CardContent className="p-5">
              <Icon className="size-4 text-accent" />
              <div className="metric-number mt-3 text-2xl font-semibold">
                {value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="listings" className="mt-7">
        <TabsList className="flex h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Listings and moderation</CardTitle>
              <form className="mt-4 flex max-w-lg gap-2">
                <Input
                  name="q"
                  defaultValue={query.q}
                  placeholder="Search name"
                />
                <Input
                  name="status"
                  defaultValue={query.status}
                  placeholder="Status"
                />
                <Button type="submit" variant="outline">
                  Filter
                </Button>
              </form>
            </CardHeader>
            <CardContent className="space-y-3">
              {listings.data?.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <Link
                        className="font-semibold hover:text-accent"
                        href={`/startup/${item.slug}`}
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.category} · {item.status} · rank{" "}
                        {item.current_rank ?? "—"} ·{" "}
                        {formatMoney(item.lifetime_spend_cents)} lifetime
                      </p>
                    </div>
                    <form
                      action={moderateListingAction}
                      className="flex flex-wrap gap-2"
                    >
                      <input type="hidden" name="listingId" value={item.id} />
                      {[
                        "approved",
                        "hidden",
                        "suspended",
                        "pending_review",
                      ].map((status) => (
                        <Button
                          key={status}
                          type="submit"
                          name="status"
                          value={status}
                          size="sm"
                          variant={
                            item.status === status ? "secondary" : "outline"
                          }
                        >
                          {status}
                        </Button>
                      ))}
                    </form>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Edit listing fields
                    </summary>
                    <form
                      action={adminEditListingAction}
                      className="mt-3 grid gap-3 sm:grid-cols-3"
                    >
                      <input type="hidden" name="listingId" value={item.id} />
                      <Input name="name" defaultValue={item.name} required />
                      <Input
                        name="tagline"
                        defaultValue={item.tagline}
                        required
                      />
                      <Input
                        name="category"
                        defaultValue={item.category}
                        required
                      />
                      <Button type="submit" size="sm" className="w-fit">
                        <Save /> Save edit
                      </Button>
                    </form>
                  </details>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Payment success and failure</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="pb-3">Payment</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Verified</th>
                    <th>Created</th>
                    <th>Replay</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.data?.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-3 font-mono text-xs">
                        {item.id.slice(0, 8)}
                      </td>
                      <td>
                        <Badge
                          variant={
                            item.status === "succeeded"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                        {item.failure_code ? (
                          <div className="mt-1 text-[10px] text-destructive">
                            {item.failure_code}
                          </div>
                        ) : null}
                      </td>
                      <td>{formatMoney(item.amount_cents)}</td>
                      <td>{item.verified ? "Yes" : "No"}</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                      <td>
                        {item.provider_payment_id ||
                        item.provider_checkout_id ? (
                          <form action={replayPaymentAction}>
                            <input
                              type="hidden"
                              name="paymentId"
                              value={item.id}
                            />
                            <Button size="sm" variant="outline" type="submit">
                              <RefreshCw /> Replay
                            </Button>
                          </form>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="webhooks" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Verified webhook history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {webhooks.data?.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border p-4 text-sm sm:flex-row"
                >
                  <div>
                    <strong>{event.event_type}</strong>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {event.provider_event_id}
                    </p>
                    {event.error_message ? (
                      <p className="mt-1 text-xs text-destructive">
                        {event.error_message}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{event.status}</Badge>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seasons" className="mt-5">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Season management</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  The same advisory-locked transaction powers cron and manual
                  rotation.
                </p>
              </div>
              <form action={rotateSeasonAction}>
                <Button type="submit">
                  <RefreshCw /> Start / close season
                </Button>
              </form>
            </CardHeader>
            <CardContent className="space-y-3">
              {seasons.data?.map((season) => (
                <div
                  key={season.id}
                  className="flex justify-between rounded-xl border p-4 text-sm"
                >
                  <span>
                    Season {season.season_number} ·{" "}
                    {new Date(season.starts_at).toLocaleDateString()}—
                    {new Date(season.ends_at).toLocaleDateString()}
                  </span>
                  <Badge
                    variant={season.status === "active" ? "default" : "outline"}
                  >
                    {season.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="content" className="mt-5 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Publish genuine testimonial</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTestimonialAction} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="quote">Quote</Label>
                  <Textarea id="quote" name="quote" required maxLength={600} />
                </div>
                <Input name="founderName" placeholder="Founder name" required />
                <Input name="startupName" placeholder="Startup name" required />
                <Input name="founderHandle" placeholder="@handle (optional)" />
                <Button type="submit">Publish testimonial</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Published testimonials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {testimonials.data?.map((item) => (
                <blockquote
                  className="rounded-xl border p-4 text-sm"
                  key={item.id}
                >
                  “{item.quote}”
                  <footer className="mt-2 text-xs text-muted-foreground">
                    {item.founder_name} · {item.startup_name} ·{" "}
                    {item.is_published ? "published" : "hidden"}
                  </footer>
                </blockquote>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value="settings"
          className="mt-5 grid gap-6 lg:grid-cols-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="size-5" /> Site settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateMinimumBidAction} className="space-y-4">
                <Label htmlFor="minimumBidDollars">
                  Minimum bid (whole USD)
                </Label>
                <Input
                  id="minimumBidDollars"
                  name="minimumBidDollars"
                  type="number"
                  min="1"
                  defaultValue={minimum / 100}
                />
                <Button type="submit">
                  <Save /> Save setting
                </Button>
              </form>
              <Alert className="mt-5">
                <ShieldCheck />
                <AlertTitle>No fake revenue controls</AlertTitle>
                <AlertDescription>
                  Admins can moderate content and rotate seasons, but cannot
                  create successful payments. Corrections require a
                  provider-backed idempotent replay and an audit record.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-5" /> Email preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-background/30 p-5">
                <div className="text-xs uppercase tracking-widest text-primary">
                  SUMMITWAR
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  Your climb is verified.
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Your payment was applied atomically. Your actual rank appears
                  here. Rankings may continue to change before the avalanche.
                </p>
                <Button className="mt-5" size="sm">
                  View the mountain
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Admin audit log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {audits.data?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col justify-between gap-2 border-b py-3 text-sm sm:flex-row"
                >
                  <div>
                    <strong>{entry.action}</strong>
                    <span className="ml-3 text-muted-foreground">
                      {entry.target_type} {entry.target_id?.slice(0, 8)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.admin_email} ·{" "}
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
