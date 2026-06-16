"use server";

import { revalidatePath } from "next/cache";
import { redeemCredit, grantTestCredits, RedeemResult } from "@/lib/credits";
import { CREDIT_PACKS, isStripeConfigured } from "@/lib/stripe/config";

// Spend 1 credit to unlock a project's cached record.
export async function redeemAction(projectId: string): Promise<RedeemResult> {
  const result = await redeemCredit(projectId);
  if (result.status === "unlocked" || result.status === "already_unlocked") {
    revalidatePath(`/project/${projectId}`);
  }
  return result;
}

// TEMPORARY: grant test credits while Stripe isn't live yet.
export async function grantTestCreditsAction(amount: number): Promise<number> {
  const balance = await grantTestCredits(amount);
  revalidatePath("/account");
  return balance;
}

// Start a Stripe Checkout to buy a credit pack. Stubbed until Stripe keys +
// price IDs are configured.
export async function buyCreditsAction(
  packId: string
): Promise<{ url: string | null; error: string | null }> {
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return { url: null, error: "Unknown credit pack." };

  if (!isStripeConfigured) {
    return {
      url: null,
      error:
        "Payments aren't connected yet. Add STRIPE_SECRET_KEY + price IDs to enable checkout.",
    };
  }

  // TODO: create a real Stripe Checkout session here once price IDs exist.
  // const session = await stripe.checkout.sessions.create({ ... });
  // return { url: session.url, error: null };
  return { url: null, error: "Stripe checkout not yet implemented." };
}
