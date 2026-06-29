import { getServerClient } from "./supabase/server";
import type { Bucket } from "./analytics-range";

// Read-side helpers for the admin analytics dashboard. Each call hits a
// SECURITY DEFINER RPC that re-checks is_admin() server-side. In demo mode
// (no Supabase) we return small mock datasets so the dashboard previews.

export interface AnalyticsSummary {
  views: number;
  visitors: number;
  purchases: number;
  revenue_cents: number;
  refunds: number;
  refunds_cents: number;
  days: number;
}

export interface TimeseriesPoint {
  bucket: string;
  views: number;
  visitors: number;
  purchases: number;
  revenue_cents: number;
}

export interface Tally {
  label: string;
  views: number;
}

export interface ChannelRow {
  channel: string;
  views: number;
  sales: number;
  revenue_cents: number;
}

export interface CampaignRow {
  campaign: string;
  views: number;
  sales: number;
  revenue_cents: number;
}

export interface PackSales {
  label: string;
  sales: number;
  revenue_cents: number;
}

export interface PurchaseRow {
  created_at: string;
  email: string | null;
  label: string;
  amount_cents: number | null;
}

export interface EventRow {
  created_at: string;
  event: string;
  email: string | null;
  path: string | null;
  label: string | null;
  amount_cents: number | null;
  channel: string | null;
  utm_campaign: string | null;
  device: string | null;
  browser: string | null;
  country: string | null;
  referrer: string | null;
}

const MOCK_SERIES: TimeseriesPoint[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86400000);
  const views = 40 + Math.round(30 * Math.sin(i / 2) + i * 4);
  const purchases = i % 4 === 0 ? 1 : 0;
  return {
    bucket: d.toISOString().slice(0, 10),
    views,
    visitors: Math.round(views * 0.7),
    purchases,
    revenue_cents: purchases * 5000,
  };
});

export async function getAnalyticsSummary(from: string, to: string): Promise<AnalyticsSummary> {
  const supabase = getServerClient();
  if (!supabase) {
    const views = MOCK_SERIES.reduce((s, d) => s + d.views, 0);
    const visitors = MOCK_SERIES.reduce((s, d) => s + d.visitors, 0);
    const purchases = MOCK_SERIES.reduce((s, d) => s + d.purchases, 0);
    return { views, visitors, purchases, revenue_cents: purchases * 5000, refunds: 0, refunds_cents: 0, days: 14 };
  }
  const { data, error } = await supabase.rpc("analytics_summary", { p_from: from, p_to: to });
  if (error) {
    console.error("analytics_summary failed:", error.message);
    return { views: 0, visitors: 0, purchases: 0, revenue_cents: 0, refunds: 0, refunds_cents: 0, days: 0 };
  }
  return data as AnalyticsSummary;
}

export async function getTimeseries(from: string, to: string, bucket: Bucket): Promise<TimeseriesPoint[]> {
  const supabase = getServerClient();
  if (!supabase) return MOCK_SERIES;
  const { data, error } = await supabase.rpc("analytics_timeseries", { p_from: from, p_to: to, p_bucket: bucket });
  if (error) {
    console.error("analytics_timeseries failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    bucket: r.bucket,
    views: Number(r.views),
    visitors: Number(r.visitors),
    purchases: Number(r.purchases),
    revenue_cents: Number(r.revenue_cents),
  }));
}

async function topTally(rpc: string, field: string, from: string, to: string, limit: number, mock: Tally[]): Promise<Tally[]> {
  const supabase = getServerClient();
  if (!supabase) return mock;
  const { data, error } = await supabase.rpc(rpc, { p_from: from, p_to: to, p_limit: limit });
  if (error) {
    console.error(`${rpc} failed:`, error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({ label: r[field], views: Number(r.views) }));
}

export function getTopPaths(from: string, to: string, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_paths", "path", from, to, limit, [
    { label: "/", views: 320 },
    { label: "/search", views: 210 },
    { label: "/account", views: 64 },
  ]);
}

export function getTopReferrers(from: string, to: string, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_referrers", "referrer", from, to, limit, [
    { label: "(direct)", views: 290 },
    { label: "google.com", views: 180 },
    { label: "facebook.com", views: 44 },
  ]);
}

export function getTopCountries(from: string, to: string, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_countries", "country", from, to, limit, [
    { label: "US", views: 410 },
    { label: "CA", views: 52 },
    { label: "GB", views: 18 },
  ]);
}

export function getTopDevices(from: string, to: string, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_devices", "device", from, to, limit, [
    { label: "Desktop", views: 280 },
    { label: "Mobile", views: 240 },
    { label: "Tablet", views: 30 },
  ]);
}

export function getTopBrowsers(from: string, to: string, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_browsers", "browser", from, to, limit, [
    { label: "Chrome", views: 320 },
    { label: "Safari", views: 180 },
    { label: "Firefox", views: 28 },
  ]);
}

export async function getChannels(from: string, to: string): Promise<ChannelRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { channel: "Organic Search", views: 260, sales: 4, revenue_cents: 18000 },
      { channel: "Direct", views: 180, sales: 3, revenue_cents: 12000 },
      { channel: "Social", views: 90, sales: 2, revenue_cents: 7000 },
      { channel: "Paid Search", views: 40, sales: 1, revenue_cents: 5000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_channels", { p_from: from, p_to: to });
  if (error) {
    console.error("analytics_channels failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    channel: r.channel,
    views: Number(r.views),
    sales: Number(r.sales),
    revenue_cents: Number(r.revenue_cents),
  }));
}

export async function getTopCampaigns(from: string, to: string, limit = 10): Promise<CampaignRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { campaign: "spring-launch", views: 120, sales: 3, revenue_cents: 13000 },
      { campaign: "(none)", views: 380, sales: 5, revenue_cents: 22000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_top_campaigns", { p_from: from, p_to: to, p_limit: limit });
  if (error) {
    console.error("analytics_top_campaigns failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    campaign: r.campaign,
    views: Number(r.views),
    sales: Number(r.sales),
    revenue_cents: Number(r.revenue_cents),
  }));
}

export async function getSalesByPack(from: string, to: string): Promise<PackSales[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { label: "Best value", sales: 2, revenue_cents: 20000 },
      { label: "Popular", sales: 3, revenue_cents: 15000 },
      { label: "Single", sales: 4, revenue_cents: 8000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_sales_by_pack", { p_from: from, p_to: to });
  if (error) {
    console.error("analytics_sales_by_pack failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({ label: r.label, sales: Number(r.sales), revenue_cents: Number(r.revenue_cents) }));
}

export async function getRecentPurchases(from: string, to: string, limit = 100): Promise<PurchaseRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    const now = Date.UTC(2026, 5, 29);
    return [
      { created_at: new Date(now - 1 * 3600000).toISOString(), email: "buyer1@example.com", label: "Best value", amount_cents: 10000 },
      { created_at: new Date(now - 5 * 3600000).toISOString(), email: "buyer2@example.com", label: "Popular", amount_cents: 5000 },
      { created_at: new Date(now - 26 * 3600000).toISOString(), email: "buyer3@example.com", label: "Single", amount_cents: 2000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_recent_purchases", { p_from: from, p_to: to, p_limit: limit });
  if (error) {
    console.error("analytics_recent_purchases failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    created_at: r.created_at,
    email: r.email,
    label: r.label,
    amount_cents: r.amount_cents === null ? null : Number(r.amount_cents),
  }));
}

export async function getEvents(filter: string, value: string | null, from: string, to: string, limit = 300): Promise<EventRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    const now = Date.UTC(2026, 5, 29, 14);
    return [
      { created_at: new Date(now - 3600000).toISOString(), event: "purchase", email: "buyer1@example.com", path: "/account", label: "Best value", amount_cents: 10000, channel: "Organic Search", utm_campaign: null, device: "Desktop", browser: "Chrome", country: "US", referrer: "https://www.google.com/" },
      { created_at: new Date(now - 7200000).toISOString(), event: "pageview", email: null, path: "/search", label: null, amount_cents: null, channel: "Direct", utm_campaign: null, device: "Mobile", browser: "Safari", country: "US", referrer: null },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_events", { p_filter: filter, p_value: value, p_from: from, p_to: to, p_limit: limit });
  if (error) {
    console.error("analytics_events failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    created_at: r.created_at,
    event: r.event,
    email: r.email,
    path: r.path,
    label: r.label,
    amount_cents: r.amount_cents === null ? null : Number(r.amount_cents),
    channel: r.channel,
    utm_campaign: r.utm_campaign,
    device: r.device,
    browser: r.browser,
    country: r.country,
    referrer: r.referrer,
  }));
}
