// Stripe configuration. Real charges activate once these server-side env vars
// are set (NOT NEXT_PUBLIC — the secret key must stay server-only).
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const isStripeConfigured = Boolean(STRIPE_SECRET_KEY);

// Credit packs. Update `price` (in USD cents) and `priceId` once you create the
// products in Stripe. `credits` is how many lookups the pack grants.
export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  price: number; // USD cents
  priceId?: string; // Stripe Price ID (set when products exist)
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "single", label: "Single", credits: 1, price: 2000 },
  { id: "popular", label: "Popular", credits: 3, price: 5000 },
  { id: "value", label: "Best value", credits: 8, price: 10000 },
];

export const formatUSD = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
