import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./config";

// Server-only Stripe client. Returns null when no secret key is configured.
export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY);
}
