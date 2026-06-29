# Launch runbook

Step-by-step to take HOA Daddy from demo mode to live — accepting real
payments and recording real analytics. Do these in order.

---

## 1. Database (Supabase → SQL Editor)

Run these SQL files if you haven't already, **in this order** (later ones
depend on earlier ones):

1. `supabase/credits-setup.sql` — profiles, credit balance, redeem/add-credits
2. `supabase/leads-setup.sql` — leads table
3. `supabase/admin-setup.sql` — `admins` table + `is_admin()` (gates the portal)
4. `supabase/analytics-setup.sql` — **new:** `page_views` table + analytics functions

> Confirm your admin emails are in `admin-setup.sql` (the `insert into admins`
> block) so you can reach `/admin` and `/admin/analytics`.

---

## 2. Environment variables (hosting / Vercel → Settings → Environment Variables)

Set these for **Production** (and Preview if you want test data there).
Everything except the two `NEXT_PUBLIC_` Supabase values is **server-only** —
never prefix a secret with `NEXT_PUBLIC`.

| Variable | Purpose | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook credits users; analytics writes | Supabase → Project Settings → API (service_role) |
| `STRIPE_SECRET_KEY` | Create checkout sessions | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures | From step 3 below |
| `NEXT_PUBLIC_SITE_URL` | Stripe redirect URLs (optional) | e.g. `https://yourdomain.com` |

After changing env vars, **redeploy** so they take effect.

---

## 3. Stripe webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR_DOMAIN/api/stripe/webhook`
3. Subscribe to event: **`checkout.session.completed`**
4. Copy the endpoint's **Signing secret** (`whsec_...`) into
   `STRIPE_WEBHOOK_SECRET` (step 2), then redeploy.

**Test mode first:** do the whole flow with Stripe test keys + the test card
`4242 4242 4242 4242` before switching to live keys.

---

## 4. Verify payments end-to-end

1. Sign in, go to `/account`, buy a pack.
2. Complete Stripe Checkout (test card in test mode).
3. You should land back on `/account?purchase=success` with the credits added.
4. In Stripe → Webhooks, the `checkout.session.completed` delivery shows `200`.

If credits don't appear: check the webhook delivery log in Stripe and your
hosting logs for the `/api/stripe/webhook` route. Most failures are a missing
`STRIPE_WEBHOOK_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Verify analytics

1. Browse a few public pages (`/`, `/search`) while signed out or in another
   browser — each pageview POSTs to `/api/track`.
2. As an admin, open `/admin` → **📊 Analytics** (or `/admin/analytics`).
3. You should see page views, unique visitors, and the views-over-time chart
   filling in. After a real purchase, **Purchases** and **Conversion** populate.

Notes:
- Country breakdown only populates on Vercel (uses edge geo headers), not on
  localhost.
- `/admin` and `/api` paths are intentionally excluded from tracking.

---

## 6. Test helpers removed ✅

The temporary "grant test credits" backdoor has been removed — from the code
(`grantTestCredits` / `grantTestCreditsAction` and the `/account` button) and
from the database (`grant_test_credits` function dropped). No further action
needed; credits can now only be added by a real Stripe purchase via the webhook.

---

## Quick checklist

- [ ] All 4 SQL files run (credits, leads, admin, analytics)
- [ ] Admin emails set in `admins`
- [ ] All env vars set in hosting + redeployed
- [ ] Stripe webhook added, subscribed to `checkout.session.completed`
- [ ] `STRIPE_WEBHOOK_SECRET` copied in + redeployed
- [ ] Test purchase succeeds and credits land
- [ ] Analytics dashboard shows traffic
- [x] Test-credit helper removed
- [ ] Switched Stripe from test keys to live keys
