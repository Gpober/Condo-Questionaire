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

## Not yet built (next steps)

- **Roles** (internal staff vs external customers) — e.g. a `profiles` table or
  user metadata, then RLS/UI gating per role.
- Recording each confirmed lookup for the audit trail / billing.
- `condo_projects_legacy` integration and `dpa_programs` matching.
