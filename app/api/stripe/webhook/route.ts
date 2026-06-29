import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { isStripeConfigured, STRIPE_WEBHOOK_SECRET, CREDIT_PACKS } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";
import { getAdminClient } from "@/lib/supabase/admin";

// Stripe sends a raw body that must be read verbatim for signature verification.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!isStripeConfigured || !stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message ?? err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = getAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
    const credits = Number(session.metadata?.credits ?? 0);

    if (!userId || !credits) {
      console.error("Webhook missing userId/credits in metadata", session.id);
      return NextResponse.json({ received: true });
    }

    if (!admin) {
      console.error("Webhook: SUPABASE_SERVICE_ROLE_KEY not set; cannot credit user");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { error } = await admin.rpc("add_credits", {
      p_user_id: userId,
      p_amount: credits,
    });
    if (error) {
      console.error("add_credits failed:", error.message);
      return NextResponse.json({ error: "Could not add credits" }, { status: 500 });
    }

    // Last-touch attribution: copy the buyer's channel/campaign from their most
    // recent pageview (matched by the anonymous session id passed at checkout).
    let channel: string | null = null;
    let utm_campaign: string | null = null;
    const sessionId = session.metadata?.sessionId;
    if (sessionId) {
      const { data: touch } = await admin
        .from("page_views")
        .select("channel, utm_campaign")
        .eq("session_id", sessionId)
        .eq("event", "pageview")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      channel = touch?.channel ?? null;
      utm_campaign = touch?.utm_campaign ?? null;
    }

    // Record the conversion with amount + pack so HOA Daddy reconciles with Stripe.
    const packId = session.metadata?.packId;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    const { error: trackErr } = await admin.from("page_views").insert({
      event: "purchase",
      path: "/account",
      user_id: userId,
      amount_cents: session.amount_total ?? null,
      label: pack?.label ?? packId ?? null,
      channel,
      utm_campaign,
    });
    if (trackErr) {
      console.error("purchase event insert failed:", trackErr.message);
    }
  } else if (event.type === "charge.refunded") {
    // Record refunds so financial analytics can net them out.
    const charge = event.data.object as Stripe.Charge;
    const packId = charge.metadata?.packId;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (admin) {
      const { error: refErr } = await admin.from("page_views").insert({
        event: "refund",
        path: "/account",
        user_id: charge.metadata?.userId ?? null,
        amount_cents: charge.amount_refunded ?? null,
        label: pack?.label ?? packId ?? null,
      });
      if (refErr) {
        console.error("refund event insert failed:", refErr.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}
