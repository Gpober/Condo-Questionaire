import { getServerClient } from "./supabase/server";

// Read-side helpers for the admin analytics dashboard. Each call hits a
// SECURITY DEFINER RPC that re-checks is_admin() server-side, so RLS + the
// function guard both protect the data. In demo mode (no Supabase) we return
// small mock datasets so the dashboard is previewable.

export interface AnalyticsSummary {
  views: number;
  visitors: number;
  purchases: number;
  days: number;
}

export interface DailyPoint {
  day: string;
  views: number;
  visitors: number;
  purchases: number;
}

export interface Tally {
  label: string;
  views: number;
}

const MOCK_DAILY: DailyPoint[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 86400000);
  const views = 40 + Math.round(30 * Math.sin(i / 2) + i * 4);
  return {
    day: d.toISOString().slice(0, 10),
    views,
    visitors: Math.round(views * 0.7),
    purchases: i % 4 === 0 ? 1 : 0,
  };
});

export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const supabase = getServerClient();
  if (!supabase) {
    const views = MOCK_DAILY.reduce((s, d) => s + d.views, 0);
    const visitors = MOCK_DAILY.reduce((s, d) => s + d.visitors, 0);
    const purchases = MOCK_DAILY.reduce((s, d) => s + d.purchases, 0);
    return { views, visitors, purchases, days };
  }
  const { data, error } = await supabase.rpc("analytics_summary", { p_days: days });
  if (error) {
    console.error("analytics_summary failed:", error.message);
    return { views: 0, visitors: 0, purchases: 0, days };
  }
  return data as AnalyticsSummary;
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
