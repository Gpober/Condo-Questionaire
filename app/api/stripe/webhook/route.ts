import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/config";
import { getAdminClient } from "@/lib/supabase/admin";

// Stripe sends raw body; do not parse/transform before signature verification.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  // TODO (when Stripe is live):
  // 1. const sig = req.headers.get("stripe-signature");
  // 2. const raw = await req.text();
  // 3. const event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  // 4. on "checkout.session.completed": read userId + credits from metadata.
  // 5. const admin = getAdminClient();
  //    await admin.rpc("add_credits", { p_user_id: userId, p_amount: credits });
  void getAdminClient;

  return NextResponse.json({ received: true });
}
