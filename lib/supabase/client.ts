"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config";

// Browser-side Supabase client (used by login/sign-up and the auth guard).
// Returns null in demo mode so callers can fall back to mock behavior.
export function getBrowserClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);
}
