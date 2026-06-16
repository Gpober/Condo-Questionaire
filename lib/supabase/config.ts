// Normalize the Supabase URL so a mis-pasted value can't produce an invalid
// request path. PostgREST returns PGRST125 "Invalid path specified in request
// URL" when the base URL has a trailing slash, a stray space/newline, or an
// accidental "/rest/v1" suffix (which would double up to /rest/v1/rest/v1/...).
function normalizeUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw
    .trim() // strip spaces/newlines from pasting
    .replace(/\/+$/, "") // trailing slashes
    .replace(/\/rest\/v1\/?$/, "") // accidental REST suffix
    .replace(/\/+$/, ""); // re-strip in case the above left a slash
}

export const SUPABASE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// When env vars are absent we run in DEMO mode (mock data, fake auth).
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
