// Strip any trailing slash(es) — a trailing slash produces "…co//rest/v1/…"
// which PostgREST rejects with "Invalid path specified in request URL".
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// When env vars are absent we run in DEMO mode (mock data, fake auth).
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
