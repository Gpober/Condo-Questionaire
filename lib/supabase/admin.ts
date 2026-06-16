import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Service-role client for trusted server-only operations (e.g. the Stripe
// webhook crediting a user after payment). NEVER import this into client code.
// Requires SUPABASE_SERVICE_ROLE_KEY (server env var, never NEXT_PUBLIC).
export function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceKey) return null;
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
