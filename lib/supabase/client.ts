"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

// Browser-side Supabase client (used by login/sign-up and the auth guard).
// Returns null only when the env vars are missing; callers that require a real
// connection should use requireBrowserClient().
export function getBrowserClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
}

// Same as getBrowserClient() but throws if Supabase isn't configured.
export function requireBrowserClient() {
  const client = getBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
}
