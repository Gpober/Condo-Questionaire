import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

// Server-side Supabase client bound to the request cookies, so queries run as
// the signed-in user and Row Level Security applies. Returns null in demo mode.
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
