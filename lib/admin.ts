import { getServerClient } from "./supabase/server";
import { Lead, LeadStatus } from "./types";

// Demo leads so the admin UI is previewable without Supabase.
const MOCK_LEADS: Lead[] = [
  {
    id: 1,
    full_name: "Jane Buyer",
    email: "jane@example.com",
    phone: "(555) 123-4567",
    project_name: "Harbor Point Condominiums",
    state: "FL",
    notes: "Closing in ~30 days, wants the questionnaire waived.",
    status: "new",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    full_name: "Marcus Lee",
    email: "marcus@example.com",
    phone: null,
    project_name: "The Madison Lofts",
    state: "IL",
    notes: null,
    status: "contacted",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// Is the current signed-in user an admin?
export async function isAdmin(): Promise<boolean> {
  const supabase = getServerClient();
  if (!supabase) return true; // demo mode: allow previewing the portal
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("is_admin check failed:", error.message);
    return false;
  }
  return Boolean(data);
}

// All leads, newest first (RLS returns rows only to admins).
export async function getLeads(): Promise<Lead[]> {
  const supabase = getServerClient();
  if (!supabase) return MOCK_LEADS;
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
  const supabase = getServerClient();
  if (!supabase) return true; // demo mode
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) {
    console.error("setLeadStatus failed:", error.message);
    return false;
  }
  return true;
}
