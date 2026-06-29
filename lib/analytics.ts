import { getServerClient } from "./supabase/server";

// Read-side helpers for the admin analytics dashboard. Each call hits a
// SECURITY DEFINER RPC that re-checks is_admin() server-side, so RLS + the
// function guard both protect the data. In demo mode (no Supabase) we return
// small mock datasets so the dashboard is previewable.

export interface AnalyticsSummary {
  views: number;
  visitors: number;
  purchases: number;
  revenue_cents: number;
  refunds: number;
  refunds_cents: number;
  days: number;
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

export interface DailyPoint {
  day: string;
  views: number;
  visitors: number;
  purchases: number;
  revenue_cents: number;
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

export interface Tally {
  label: string;
  views: number;
}

const MOCK_DAILY: DailyPoint[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86400000);
  const views = 40 + Math.round(30 * Math.sin(i / 2) + i * 4);
  const purchases = i % 4 === 0 ? 1 : 0;
  return {
    day: d.toISOString().slice(0, 10),
    views,
    visitors: Math.round(views * 0.7),
    purchases,
    revenue_cents: purchases * 5000,
  };
});

export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const supabase = getServerClient();
  if (!supabase) {
    const views = MOCK_DAILY.reduce((s, d) => s + d.views, 0);
    const visitors = MOCK_DAILY.reduce((s, d) => s + d.visitors, 0);
    const purchases = MOCK_DAILY.reduce((s, d) => s + d.purchases, 0);
    return { views, visitors, purchases, revenue_cents: purchases * 5000, refunds: 0, refunds_cents: 0, days };
  }
  const { data, error } = await supabase.rpc("analytics_summary", { p_days: days });
  if (error) {
    console.error("analytics_summary failed:", error.message);
    return { views: 0, visitors: 0, purchases: 0, revenue_cents: 0, refunds: 0, refunds_cents: 0, days };
  }
  return data as AnalyticsSummary;
}

export async function getRecentPurchases(days: number, limit = 100): Promise<PurchaseRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    const now = Date.UTC(2026, 5, 29);
    return [
      { created_at: new Date(now - 1 * 3600000).toISOString(), email: "buyer1@example.com", label: "Best value", amount_cents: 10000 },
      { created_at: new Date(now - 5 * 3600000).toISOString(), email: "buyer2@example.com", label: "Popular", amount_cents: 5000 },
      { created_at: new Date(now - 26 * 3600000).toISOString(), email: "buyer3@example.com", label: "Single", amount_cents: 2000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_recent_purchases", { p_days: days, p_limit: limit });
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

export async function getSalesByPack(days: number): Promise<PackSales[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { label: "Best value", sales: 2, revenue_cents: 20000 },
      { label: "Popular", sales: 3, revenue_cents: 15000 },
      { label: "Single", sales: 4, revenue_cents: 8000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_sales_by_pack", { p_days: days });
  if (error) {
    console.error("analytics_sales_by_pack failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    label: r.label,
    sales: Number(r.sales),
    revenue_cents: Number(r.revenue_cents),
  }));
}

export async function getAnalyticsDaily(days: number): Promise<DailyPoint[]> {
  const supabase = getServerClient();
  if (!supabase) return MOCK_DAILY;
  const { data, error } = await supabase.rpc("analytics_daily", { p_days: days });
  if (error) {
    console.error("analytics_daily failed:", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({
    day: r.day,
    views: Number(r.views),
    visitors: Number(r.visitors),
    purchases: Number(r.purchases),
    revenue_cents: Number(r.revenue_cents),
  }));
}

async function topTally(
  rpc: string,
  field: string,
  days: number,
  limit: number,
  mock: Tally[]
): Promise<Tally[]> {
  const supabase = getServerClient();
  if (!supabase) return mock;
  const { data, error } = await supabase.rpc(rpc, { p_days: days, p_limit: limit });
  if (error) {
    console.error(`${rpc} failed:`, error.message);
    return [];
  }
  return (data ?? []).map((r: any) => ({ label: r[field], views: Number(r.views) }));
}

export function getTopPaths(days: number, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_paths", "path", days, limit, [
    { label: "/", views: 320 },
    { label: "/search", views: 210 },
    { label: "/account", views: 64 },
  ]);
}

export function getTopReferrers(days: number, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_referrers", "referrer", days, limit, [
    { label: "(direct)", views: 290 },
    { label: "google.com", views: 180 },
    { label: "facebook.com", views: 44 },
  ]);
}

export function getTopCountries(days: number, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_countries", "country", days, limit, [
    { label: "US", views: 410 },
    { label: "CA", views: 52 },
    { label: "GB", views: 18 },
  ]);
}

export function getTopDevices(days: number, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_devices", "device", days, limit, [
    { label: "Desktop", views: 280 },
    { label: "Mobile", views: 240 },
    { label: "Tablet", views: 30 },
  ]);
}

export function getTopBrowsers(days: number, limit = 10): Promise<Tally[]> {
  return topTally("analytics_top_browsers", "browser", days, limit, [
    { label: "Chrome", views: 320 },
    { label: "Safari", views: 180 },
    { label: "Firefox", views: 28 },
  ]);
}

export async function getChannels(days: number): Promise<ChannelRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { channel: "Organic Search", views: 260, sales: 4, revenue_cents: 18000 },
      { channel: "Direct", views: 180, sales: 3, revenue_cents: 12000 },
      { channel: "Social", views: 90, sales: 2, revenue_cents: 7000 },
      { channel: "Paid Search", views: 40, sales: 1, revenue_cents: 5000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_channels", { p_days: days });
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

export async function getTopCampaigns(days: number, limit = 10): Promise<CampaignRow[]> {
  const supabase = getServerClient();
  if (!supabase) {
    return [
      { campaign: "spring-launch", views: 120, sales: 3, revenue_cents: 13000 },
      { campaign: "(none)", views: 380, sales: 5, revenue_cents: 22000 },
    ];
  }
  const { data, error } = await supabase.rpc("analytics_top_campaigns", { p_days: days, p_limit: limit });
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
