import { getServerClient } from "./supabase/server";
import { getAdminClient } from "./supabase/admin";
import { isAdmin } from "./admin";
import { MOCK_PROJECTS } from "./mockData";
import { CondoProject, CondoSummary, SearchFilters, SortField } from "./types";

const hasAnyFilter = (f: SearchFilters): boolean =>
  Object.values(f).some((v) => v && String(v).trim() !== "");

// PostgREST caps each response (default 1000 rows), so we page through with
// .range() to return EVERY matching row.
const PAGE_SIZE = 1000;

const toSummary = (p: CondoProject): CondoSummary => ({
  id: p.id,
  project_name: p.project_name,
  county: p.county,
  state: p.state,
  zip_code: p.zip_code,
});

function rpcArgs(filters: SearchFilters) {
  const clean = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);
  const idStr = filters.condo_id?.trim();
  return {
    p_state: clean(filters.state),
    p_county: clean(filters.county),
    p_project_name: clean(filters.project_name),
    p_zip: clean(filters.zip_code),
    p_condo_id: idStr && /^\d+$/.test(idStr) ? Number(idStr) : null,
  };
}

// Public search — returns SUMMARY rows only, via the security-definer RPC.
export async function searchProjects(
  filters: SearchFilters,
  sortBy: SortField = "project_name"
): Promise<CondoSummary[]> {
  if (!hasAnyFilter(filters)) return [];

  const supabase = getServerClient();
  if (supabase) {
    const args = rpcArgs(filters);
    const all: CondoSummary[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .rpc("search_condos", args)
        .order(sortBy, { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      const rows = (data ?? []) as CondoSummary[];
      all.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    return all;
  }

  // DEMO mode — filter the mock set in memory.
  const match = (value: string | null, needle?: string) =>
    !needle || (value ?? "").toLowerCase().includes(needle.toLowerCase());
  return MOCK_PROJECTS.filter(
    (p) =>
      match(p.project_name, filters.project_name) &&
      match(p.county, filters.county) &&
      (!filters.state || p.state === filters.state) &&
      match(p.zip_code, filters.zip_code) &&
      (!filters.condo_id || String(p.id) === filters.condo_id.trim())
  )
    .map(toSummary)
    .sort((a, b) => String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? "")));
}

// Summary for one project (non-sensitive) — used for the paywall header so we
// can show the name without revealing the paid record.
export async function getCondoSummary(id: string): Promise<CondoSummary | null> {
  const supabase = getServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .rpc("search_condos", {
        p_state: null,
        p_county: null,
        p_project_name: null,
        p_zip: null,
        p_condo_id: Number(id),
      })
      .limit(1);
    if (error) {
      console.error("getCondoSummary failed:", error.message);
      return null;
    }
    const rows = (data ?? []) as CondoSummary[];
    return rows[0] ?? null;
  }
  const p = MOCK_PROJECTS.find((m) => String(m.id) === id);
  return p ? toSummary(p) : null;
}

// FULL record — only returns data if the signed-in user has unlocked (paid for)
// this project, enforced inside the get_unlocked_project RPC.
export async function getProject(id: string): Promise<CondoProject | null> {
  const supabase = getServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .rpc("get_unlocked_project", { p_project_id: Number(id) })
      .maybeSingle();
    if (error) {
      console.error("getProject query failed:", error.message);
    }
    if (data) return data as CondoProject;

    // Admin override: admins view any record for free (no credit needed). The
    // get_unlocked_project RPC also grants this once admin-free-access.sql is
    // applied; this service-role fallback makes it work even before then.
    if (await isAdmin()) {
      const admin = getAdminClient();
      if (admin) {
        const { data: row, error: adminErr } = await admin
          .from("condo_projects")
          .select("*")
          .eq("id", Number(id))
          .maybeSingle();
        if (adminErr) console.error("getProject admin fallback failed:", adminErr.message);
        if (row) return row as CondoProject;
      }
    }
    return null;
  }
  return MOCK_PROJECTS.find((p) => String(p.id) === id) ?? null;
}
