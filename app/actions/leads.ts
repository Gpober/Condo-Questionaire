"use server";

import { requireServerClient } from "@/lib/supabase/server";

export interface LeadInput {
  full_name: string;
  email: string;
  phone?: string;
  project_name?: string;
  state?: string;
  notes?: string;
}

export async function submitLeadAction(
  input: LeadInput
): Promise<{ ok: boolean; error: string | null }> {
  const name = input.full_name?.trim();
  const email = input.email?.trim();
  if (!name || !email) return { ok: false, error: "Name and email are required." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }

  const supabase = requireServerClient();

  const { error } = await supabase.from("leads").insert({
    full_name: name,
    email,
    phone: input.phone?.trim() || null,
    project_name: input.project_name?.trim() || null,
    state: input.state?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) {
    console.error("submitLeadAction failed:", error.message);
    return { ok: false, error: "Could not submit. Please try again." };
  }
  return { ok: true, error: null };
}
