# Condo Questionnaire Hub

A platform to **lower the cost of the condo questionnaire process** by caching and
reusing completed questionnaires instead of re-ordering (and re-paying for) one
every time a project comes up for financing.

## The cost model

A condo questionnaire ordered fresh from an HOA/management company typically costs
**$150–$350+** and takes days to weeks. The same project gets re-questioned for
every new loan. This platform answers each questionnaire **once per project**, then
serves the cached record to every subsequent loan — gated behind an intentional
"are you sure?" confirmation so each reveal is a deliberate, auditable lookup.

## MVP flow

```
Login  →  Multi-field search  →  Results list  →  Double-confirm  →  Project detail
```

- **Login** — email + password via Supabase Auth (required).
- **Search** — structured filter form: State, County, Condo ID, Condo Name, City,
  Zip Code, plus a "Sorted By" selector (Condo Name / City / State / Zip Code).
- **Results** — 0, 1, or many matches with a warrantability / blacklist badge.
- **Double-confirmation** — "Are you sure you want to proceed?" guards each lookup.
- **Detail** — the full cached questionnaire on its own page.

## Tech stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres + Auth) via `@supabase/supabase-js`

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
```

**Supabase is required** — there is no mock/demo fallback. If the two
`NEXT_PUBLIC_SUPABASE_*` env vars are missing, database-backed code throws
(`require{Server,Browser}Client`) rather than serving fake data. Copy
`.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Wiring the real schema

The `condo_projects` shape in `lib/types.ts` and the queries in `lib/projects.ts`
are a **best guess** until the real Supabase schema is confirmed. To finalize:

1. Confirm the actual columns of `condo_projects` (and `blacklisted_projects`,
   `condo_projects_legacy`, `dpa_programs`).
2. Update `CondoProjectSummary` / `CondoProjectDetail` in `lib/types.ts`.
3. Align the `.select(...)` / `.ilike(...)` / `.eq(...)` calls in `lib/projects.ts`.

## Authentication

Uses **Supabase Auth** with cookie-based sessions (`@supabase/ssr`):

- **Sign in** and self-service **sign up** on `/login`.
- `middleware.ts` protects `/search` and `/project/*` server-side and refreshes
  the session; `AuthGuard` is the client-side backstop.
- Server queries run as the signed-in user, so **Row Level Security** applies.

With open sign-up enabled, anyone can register. If you require email
confirmation (Supabase default), users must confirm before their first sign-in.

### Recommended Supabase settings
- Authentication → Providers → Email: keep **Confirm email** on for real use.
- Add **RLS policies** to `condo_projects` / `blacklisted_projects` so only
  authenticated users can read (the app already queries as the user).

## Credits & payments (paywall)

Searching is **free and public**. Opening a condo's cached record costs **1
credit** and requires a signed-in user. Viewing a record you've already unlocked
is free.

- DB: run `supabase/credits-setup.sql` (profiles + balance, lookups/unlocks,
  atomic `redeem_credit` RPC, `add_credits` for the webhook, RLS, and a
  signup trigger). It also includes a temporary `grant_test_credits` helper —
  **remove it before real launch.**
- Buy credits on `/account` (3 packs in `lib/stripe/config.ts`).
- **Stripe Checkout is implemented.** Packs are sold via dynamic `price_data`,
  so no pre-created Stripe Price IDs are required — just edit the packs.

### Going live with Stripe
1. Create a Stripe account (test mode first).
2. Set these **server-only** env vars (never `NEXT_PUBLIC`):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY` (lets the webhook credit users)
   - optional `NEXT_PUBLIC_SITE_URL` (otherwise auto-detected from request)
3. Add a webhook endpoint in Stripe pointing to `/api/stripe/webhook`,
   subscribed to `checkout.session.completed`. Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.

Flow: `/account` → Buy → Stripe Checkout → on success the webhook calls the
`add_credits` RPC (service role) to top up the user's balance.

Until `STRIPE_SECRET_KEY` is set, the **“+5 test credits”** button on `/account`
lets you exercise the credit flow without paying.

## Growth features (SEO, email capture, referrals)

Three marketing levers, each gated behind its own SQL migration:

- **Public SEO pages** — `/condo/[id]` are public, indexable summary pages
  (name, location, and a coarse *warrantable / non-warrantable / blacklisted*
  badge). The full cached questionnaire stays behind the credit paywall. A
  crawlable directory lives at `/condo`, plus generated `/sitemap.xml` and
  `/robots.txt`. Set `NEXT_PUBLIC_SITE_URL` so those use your real domain.
  Run `supabase/public-pages.sql` (adds the summary-only `public_condo_status`
  RPC that computes the badge server-side without leaking the paid fields).
- **Email capture** — a subscribe box on `/search`, `/condo`, and each condo
  page builds a marketing list. Captured emails appear under `/admin`. Run
  `supabase/subscribers-setup.sql` (public insert, admin-only read).
- **Invite-for-credits referrals** — each signed-in user gets a share link on
  `/account`; when an invite signs up, both get bonus credits (2 referrer / 1
  new). Run `supabase/referrals-setup.sql`.

## Not yet built (next steps)

- Real Stripe Checkout + webhook (scaffolded, see above).
- **Roles** (internal staff vs external customers).
- `condo_projects_legacy` integration and `dpa_programs` matching.
