import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

const NOT_CONFIGURED =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

// Server-side Supabase client bound to the request cookies, so queries run as
// the signed-in user and Row Level Security applies. Returns null only when the
// env vars are missing; most callers should use requireServerClient() instead.
export function getServerClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components cookie writes throw — that's fine, the middleware
        // refreshes the session. Swallow the error here.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* called from a Server Component; ignore */
        }
      },
    },
  });
}

// Same as getServerClient() but throws if Supabase isn't configured. Use this
// everywhere a real database connection is required — there is no mock fallback.
export function requireServerClient() {
  const client = getServerClient();
  if (!client) throw new Error(NOT_CONFIGURED);
  return client;
}
