import { requireServerClient } from "./supabase/server";
import { CondoProject, CondoSummary, SearchFilters, SortField } from "./types";

const hasAnyFilter = (f: SearchFilters): boolean =>
  Object.values(f).some((v) => v && String(v).trim() !== "");

// PostgREST caps each response (default 1000 rows), so we page through with
// .range() to return EVERY matching row.
const PAGE_SIZE = 1000;

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

  const supabase = requireServerClient();
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

// Summary for one project (non-sensitive) — used for the paywall header so we
// can show the name without revealing the paid record.
export async function getCondoSummary(id: string): Promise<CondoSummary | null> {
  const supabase = requireServerClient();
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

// FULL record — only returns data if the signed-in user has unlocked (paid for)
// this project, enforced inside the get_unlocked_project RPC.
export async function getProject(id: string): Promise<CondoProject | null> {
  const supabase = requireServerClient();
  const { data, error } = await supabase
    .rpc("get_unlocked_project", { p_project_id: Number(id) })
    .maybeSingle();
  if (error) {
    console.error("getProject query failed:", error.message);
    return null;
  }
  return (data ?? null) as CondoProject | null;
}
