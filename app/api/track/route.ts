import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { deriveChannel, deviceFromUA, browserFromUA } from "@/lib/analytics-derive";

// Lightweight, cookieless pageview tracker. The browser POSTs the path,
// referrer, and an anonymous per-session id; we add the country from Vercel's
// edge headers and insert with the service role (the table is RLS-locked).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = getAdminClient();
  // Demo mode (no service-role key): accept and no-op so the client stays quiet.
  if (!admin) return NextResponse.json({ ok: true, skipped: true });

  let body: {
    path?: string;
    referrer?: string;
    sessionId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 512) : null;
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  // Ignore internal/admin/api paths so the dashboard doesn't count itself.
  if (path.startsWith("/admin") || path.startsWith("/api")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);
  const referrer = str(body.referrer, 512);
  const sessionId = str(body.sessionId, 64);
  const utmSource = str(body.utmSource, 128);
  const utmMedium = str(body.utmMedium, 128);
  const utmCampaign = str(body.utmCampaign, 128);

  // Vercel/edge providers set this; falls back to null elsewhere.
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    null;

  const ua = req.headers.get("user-agent");

  const { error } = await admin.from("page_views").insert({
    event: "pageview",
    path,
    referrer,
    country,
    session_id: sessionId,
    device: deviceFromUA(ua),
    browser: browserFromUA(ua),
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    channel: deriveChannel(utmMedium, utmSource, referrer),
  });

  if (error) {
    console.error("track insert failed:", error.message);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
