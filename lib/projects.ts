import { getServerClient } from "./supabase/server";
import { MOCK_PROJECTS } from "./mockData";
import { CondoProject, SearchFilters, SortField } from "./types";

const hasAnyFilter = (f: SearchFilters): boolean =>
  Object.values(f).some((v) => v && String(v).trim() !== "");

// Lightweight search across cached projects using the multi-field intake form.
export async function searchProjects(
  filters: SearchFilters,
  sortBy: SortField = "project_name"
): Promise<CondoProject[]> {
  if (!hasAnyFilter(filters)) return [];

  const supabase = getServerClient();
  if (supabase) {
    let q = supabase.from("condo_projects").select("*");

    if (filters.project_name) q = q.ilike("project_name", `%${filters.project_name}%`);
    if (filters.county) q = q.ilike("county", `%${filters.county}%`);
    if (filters.state) q = q.eq("state", filters.state);
    if (filters.zip_code) q = q.ilike("zip_code", `%${filters.zip_code}%`);
    if (filters.condo_id && /^\d+$/.test(filters.condo_id.trim())) {
      q = q.eq("id", Number(filters.condo_id.trim()));
    }

    const { data, error } = await q.order(sortBy, { ascending: true }).limit(50);
    if (error) throw error;
    return (data ?? []) as CondoProject[];
  }

  // DEMO mode — filter the mock set in memory.
  const match = (value: string | null, needle?: string) =>
    !needle || (value ?? "").toLowerCase().includes(needle.toLowerCase());

  const results = MOCK_PROJECTS.filter(
    (p) =>
      match(p.project_name, filters.project_name) &&
      match(p.county, filters.county) &&
      (!filters.state || p.state === filters.state) &&
      match(p.zip_code, filters.zip_code) &&
      (!filters.condo_id || String(p.id) === filters.condo_id.trim())
  );

  return results.sort((a, b) =>
    String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""))
  );
}

// Full record. In production this is the billable "lookup" — call AFTER the
// user confirms, and record the spend for the audit trail.
export async function getProject(id: string): Promise<CondoProject | null> {
  const supabase = getServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("condo_projects")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();
    if (error) {
      // Don't crash the page — log and treat as "not found". A common cause is
      // RLS blocking the anon role (login is disabled). See README.
      console.error("getProject query failed:", error.message);
      return null;
    }
    return (data ?? null) as CondoProject | null;
  }

  return MOCK_PROJECTS.find((p) => String(p.id) === id) ?? null;
}
