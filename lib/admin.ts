import { requireServerClient } from "./supabase/server";
import { Lead, LeadStatus } from "./types";

// Is the current signed-in user an admin?
export async function isAdmin(): Promise<boolean> {
  const supabase = requireServerClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("is_admin check failed:", error.message);
    return false;
  }
  return Boolean(data);
}

// All leads, newest first (RLS returns rows only to admins).
export async function getLeads(): Promise<Lead[]> {
  const supabase = requireServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getLeads failed:", error.message);
    return [];
  }
  return (data ?? []) as Lead[];
}

// Update a lead's status (admin-only via RLS).
export async function setLeadStatus(id: number, status: LeadStatus): Promise<boolean> {
  const supabase = requireServerClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) {
    console.error("setLeadStatus failed:", error.message);
    return false;
  }
  return true;
}
