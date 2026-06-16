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

- **Login** — email + password (Supabase Auth when configured; demo mode otherwise).
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

Without Supabase env vars the app runs in **DEMO mode** against `lib/mockData.ts`
(any email/password logs in). To connect your real database, copy `.env.example`
to `.env.local` and set:

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
In demo mode (no keys) any email/password is accepted.

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
- **Stripe is stubbed** until configured. To go live:
  - Set server env vars `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
    (NOT `NEXT_PUBLIC`), plus `SUPABASE_SERVICE_ROLE_KEY` for the webhook.
  - Create the credit-pack products in Stripe and add their `priceId`s.
  - Implement the Checkout session in `app/actions/credits.ts` and the
    `checkout.session.completed` handler in `app/api/stripe/webhook/route.ts`.

While Stripe is stubbed, use the **“+5 test credits”** button on `/account` to
exercise the flow.

## Not yet built (next steps)

- Real Stripe Checkout + webhook (scaffolded, see above).
- **Roles** (internal staff vs external customers).
- `condo_projects_legacy` integration and `dpa_programs` matching.
