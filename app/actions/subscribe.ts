"use server";

import { getServerClient } from "@/lib/supabase/server";

// Capture an email for the marketing list. Public: anyone can subscribe; the
// list is readable only by admins (RLS). Duplicate emails are ignored.
export async function subscribeAction(
  emailRaw: string,
  source = "search"
): Promise<{ ok: boolean; error: string | null }> {
  const email = emailRaw?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  const supabase = getServerClient();
  if (!supabase) return { ok: true, error: null }; // demo mode

  const { error } = await supabase
    .from("subscribers")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("subscribeAction failed:", error.message);
    return { ok: false, error: "Could not subscribe. Please try again." };
  }
  return { ok: true, error: null };
}
