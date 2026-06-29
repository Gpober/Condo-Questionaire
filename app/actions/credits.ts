"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redeemCredit, getUserId, RedeemResult } from "@/lib/credits";
import { CREDIT_PACKS, isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

// Spend 1 credit to unlock a project's cached record.
export async function redeemAction(projectId: string): Promise<RedeemResult> {
  const result = await redeemCredit(projectId);
  if (result.status === "unlocked" || result.status === "already_unlocked") {
    revalidatePath(`/project/${projectId}`);
  }
  return result;
}

// Best-effort site origin for Stripe redirect URLs.
function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

// Start a Stripe Checkout session to buy a credit pack.
export async function buyCreditsAction(
  packId: string,
  sessionId?: string | null
): Promise<{ url: string | null; error: string | null }> {
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return { url: null, error: "Unknown credit pack." };

  const stripe = getStripe();
  if (!isStripeConfigured || !stripe) {
    return {
      url: null,
      error: "Payments aren't connected yet. Add STRIPE_SECRET_KEY to enable checkout.",
    };
  }

  const userId = await getUserId();
  if (!userId) return { url: null, error: "Please sign in before buying credits." };

  const origin = siteOrigin();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Build the line item from the pack so no pre-created Price ID is required.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.price,
            product_data: {
              name: `${pack.label} pack — ${pack.credits} credits`,
            },
          },
        },
      ],
      // The webhook reads these to credit the right user and attribute the sale.
      client_reference_id: userId,
      metadata: { userId, credits: String(pack.credits), packId: pack.id, sessionId: sessionId ?? "" },
      payment_intent_data: {
        metadata: { userId, credits: String(pack.credits), packId: pack.id },
      },
      success_url: `${origin}/account?purchase=success`,
      cancel_url: `${origin}/account?purchase=cancel`,
    });

    return { url: session.url, error: null };
  } catch (e: any) {
    console.error("buyCreditsAction failed:", e?.message ?? e);
    return { url: null, error: "Could not start checkout. Please try again." };
  }
}
