import { getServerClient } from "./supabase/server";
import { getAdminClient } from "./supabase/admin";
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

export interface Member {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  credit_balance: number;
  purchases: number;
  total_spent_cents: number;
}

// Everyone who has created a login (Supabase auth users). Requires the
// service-role key (auth admin API); returns [] without it.
export async function getMembers(): Promise<Member[]> {
  const admin = getAdminClient();
  if (!admin) return [];
  const members: Member[] = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("getMembers failed:", error.message);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) {
      const meta = (u.user_metadata ?? {}) as { first_name?: string; last_name?: string };
      const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ") || null;
      members.push({
        id: u.id,
        email: u.email ?? null,
        name,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        credit_balance: 0,
        purchases: 0,
        total_spent_cents: 0,
      });
    }
    if (users.length < perPage) break;
  }

  // Enrich each member with their credit balance and purchase history.
  const balanceById = new Map<string, number>();
  const { data: profiles } = await admin.from("profiles").select("id, credit_balance");
  for (const p of profiles ?? []) balanceById.set(p.id as string, Number(p.credit_balance ?? 0));

  const buysById = new Map<string, { count: number; cents: number }>();
  const { data: buys } = await admin
    .from("page_views")
    .select("user_id, amount_cents")
    .eq("event", "purchase");
  for (const b of buys ?? []) {
    const uid = b.user_id as string | null;
    if (!uid) continue;
    const agg = buysById.get(uid) ?? { count: 0, cents: 0 };
    agg.count += 1;
    agg.cents += Number(b.amount_cents ?? 0);
    buysById.set(uid, agg);
  }

  for (const m of members) {
    m.credit_balance = balanceById.get(m.id) ?? 0;
    const agg = buysById.get(m.id);
    m.purchases = agg?.count ?? 0;
    m.total_spent_cents = agg?.cents ?? 0;
  }

  members.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return members;
}

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
