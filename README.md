# SummitWar

SummitWar is a production-oriented competitive startup discovery application for [SummitWar.lol](https://www.summitwar.lol). Founders buy one-time, whole-dollar climbs; each verified dollar adds 100 metres during a Monday-to-Sunday UTC season. Placement is explicitly sponsored and uses no votes, reviews, or hidden scoring.

## What is included

- Next.js 16 App Router, strict TypeScript, React Server Components, Tailwind CSS 4, and owned shadcn/ui source components
- Original responsive SVG mountain with 50 camps, keyboard/tap detail drawer, premium top-three treatment, summit beam, Realtime rank refresh, and reduced-motion behavior
- Public mountain, immutable activity feed, Base Camp search/filtering, startup profiles, statistics, rules, Hall of Fame, and seven dynamic 1200×630 share-card variants
- Passwordless Supabase Auth owner dashboard with profile/logo editing, metrics, rank history, competitors, top-ups, and share assets
- Allowlisted admin dashboard for moderation, listing edits, payments, idempotent provider replay, webhooks, seasons, testimonials, settings, CSV exports, and audit history
- Supabase Postgres migration containing indexed tables, restrictive RLS, storage rules, analytics deduplication, rate limits, season rotation, and an atomic payment/ranking transaction
- Stripe-hosted Checkout provider abstraction, signed webhook verification with the official Stripe SDK, and safe development fallbacks
- Vitest domain/security coverage and Playwright journeys

## Non-negotiable integrity rules

The browser and checkout return page never update altitude. `apply_verified_payment` is the only payment-credit path. It runs in one Postgres transaction, locks the active season and participating listings, rejects amount/currency mismatch, stores a unique provider event, prevents repeated provider payment IDs, recalculates every rank with the tie timestamp, appends an immutable event, and updates public aggregates.

Verified revenue is separate from admin activity. There is no admin action for manufacturing a successful payment. Replays first retrieve the PaymentIntent from Stripe and remain idempotent at the database layer.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- A Supabase project on a supported Postgres version
- A Stripe account
- Optional for local database testing: Docker Desktop and the current Supabase CLI

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With `NEXT_PUBLIC_DEMO_MODE=true` and no production build, the interface uses visibly labelled in-process demo data. The development checkout adapter takes no money and never changes rank.

Production builds never use the in-process demo dataset, even if the public demo variable is accidentally left on. Production starts with zero metrics and no fake testimonials, events, payments, or revenue.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL, publishable key, and secret key into `.env.local`. The secret key must never use a `NEXT_PUBLIC_` prefix.
3. Link and apply the migration:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

4. In Authentication → URL Configuration, set the Site URL and add `http://localhost:3000/auth/callback` plus the production callback URL.
5. Confirm the `startup-logos` public bucket exists with its 2 MB PNG/JPG/WebP restriction.
6. Confirm `listings` and `ranking_events` are in the `supabase_realtime` publication.
7. Run database advisors and address project-specific warnings:

```bash
npx supabase@latest db advisors
npx supabase@latest migration list
```

The migration explicitly enables RLS on every exposed table. Public roles can read only approved/public material. Owners receive column-scoped updates to their own rows. Payments, spend, rank, seasons, event metrics, webhook events, contacts, and audit logs have no browser write policy.

### Optional local SQL seed

`supabase/seed.sql` creates three zero-altitude local listings marked `is_demo=true`. It is used by `supabase db reset`, not by `supabase db push`:

```bash
npx supabase@latest start
npx supabase@latest db reset
```

Do not run the seed file against production. Seeded rows are labelled “Demo data” in public UI.

## Stripe test mode

1. Copy a Stripe test-mode secret key into `STRIPE_SECRET_KEY`. SummitWar creates one-time Checkout Sessions with an inline USD price for the validated whole-dollar climb, so no pre-created Stripe Product or Price is required.
2. Install and authenticate the Stripe CLI, then forward signed local events:

```bash
stripe listen --events checkout.session.completed,checkout.session.async_payment_succeeded --forward-to localhost:3000/api/webhooks/stripe
```

3. Copy the CLI's `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` and restart the development server.
4. Start a climb and use Stripe's `4242 4242 4242 4242` test card with any future expiry and CVC.
5. In production, create a Stripe webhook destination at:

```text
https://YOUR_DOMAIN/api/webhooks/stripe
```

Subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. The route reads the raw request body, verifies `Stripe-Signature`, accepts only paid one-time Checkout Sessions, and validates the required amount, currency, PaymentIntent, and internal UUID before calling the database transaction.

The metadata sent on both the Checkout Session and PaymentIntent contains `summitwar_payment_id` and `summitwar_listing_id`. The webhook trusts the pending payment stored server-side—not browser amounts or redirect query parameters. A stale quote still credits the paid amount and returns the actual resulting rank.

## Weekly season cron

`vercel.json` defines one UTC job:

- Monday 00:00 — atomically close the prior season, archive champion/runner-up, reset seasonal fields, and start the new season

Vercel sends `Authorization: Bearer $CRON_SECRET`. Set a random secret of at least 32 characters. The route uses constant-time comparison. The database also takes a transaction-scoped advisory lock, so concurrent cron/manual requests cannot create two active seasons.

To initialize the first production season after migration, invoke the protected endpoint once or call the RPC with the service role from the SQL editor:

```sql
select public.rotate_weekly_season(now());
```

## Vercel deployment

1. Import the repository into Vercel.
2. Add every value from `.env.example` for Production. Use a Stripe `sk_live_...` key only after test-mode Checkout and webhook verification succeeds.
3. Set `NEXT_PUBLIC_APP_URL=https://www.summitwar.lol`. Stripe Checkout derives its success and cancellation URLs from this value. Configure the Stripe webhook directly at `https://www.summitwar.lol/api/webhooks/stripe`; Stripe webhook destinations must not rely on the apex-domain redirect.
4. Leave `NEXT_PUBLIC_DEMO_MODE=false` in production.
5. Deploy, then verify the two cron jobs under Project Settings → Cron Jobs.
6. Add the production Auth callback to Supabase and the production webhook URL to Stripe.

## Analytics and privacy

- Raw IP addresses are never persisted.
- The server derives an HMAC-SHA256 visitor fingerprint from request traits and `VISITOR_FINGERPRINT_SALT`.
- Known bots are ignored.
- Views and clicks deduplicate per listing, fingerprint, and hour.
- Both in-process burst protection and atomic Postgres rate-limit buckets guard endpoints.
- Outbound redirects accept only a known listing UUID and load the normalized destination from Postgres, preventing open redirects.
- Public counts are labelled approximate. Revenue is always labelled transaction revenue, never MRR.

## Commands and verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright starts the app with visibly labelled demo data. A real signed webhook and database Realtime run require Supabase and Stripe test credentials; the database transaction, duplicate delivery, concurrent top-ups, stale quotes, resets, authorization, URL safety, and deduplication are covered by deterministic tests.

## Operational notes

- Stripe Checkout Sessions are behind `PaymentProvider`; replacing checkout creation later does not change ranking SQL.
- A payment success redirect can safely arrive before its webhook. The UI deliberately says verification is pending.
- Structured logs include event names and internal payment IDs, never API keys, full webhook bodies, or payer emails.
- SVG logo uploads are intentionally rejected; SVG can carry active content. Accepted formats are PNG, JPEG, and WebP up to 2 MB.
- Paid external links go through `/api/out/[id]` and use `rel="sponsored noopener"` on public pages.
