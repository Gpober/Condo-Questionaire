import { isSupabaseConfigured, supabase } from "./supabase";
import { MOCK_PROJECTS } from "./mockData";
import {
  CondoProjectDetail,
  CondoProjectSummary,
  SearchFilters,
  SortField,
} from "./types";

const SUMMARY_COLUMNS =
  "id, condo_id, project_name, address, city, county, state, zip, warrantability, blacklisted, last_updated";

const toSummary = (p: CondoProjectDetail): CondoProjectSummary => ({
  id: p.id,
  condo_id: p.condo_id,
  project_name: p.project_name,
  address: p.address,
  city: p.city,
  county: p.county,
  state: p.state,
  zip: p.zip,
  warrantability: p.warrantability,
  blacklisted: p.blacklisted,
  last_updated: p.last_updated,
});

const hasAnyFilter = (f: SearchFilters): boolean =>
  Object.values(f).some((v) => v && String(v).trim() !== "");

// Free, lightweight search across cached projects using the multi-field intake
// form. Returns summaries only — the full questionnaire is gated behind the
// confirm step (see getProject()).
export async function searchProjects(
  filters: SearchFilters,
  sortBy: SortField = "project_name"
): Promise<CondoProjectSummary[]> {
  if (!hasAnyFilter(filters)) return [];

  if (isSupabaseConfigured && supabase) {
    // TODO: align columns with the real `condo_projects` schema once known.
    let q = supabase.from("condo_projects").select(SUMMARY_COLUMNS);

    if (filters.condo_name) q = q.ilike("project_name", `%${filters.condo_name}%`);
    if (filters.condo_id) q = q.ilike("condo_id", `%${filters.condo_id}%`);
    if (filters.city) q = q.ilike("city", `%${filters.city}%`);
    if (filters.county) q = q.ilike("county", `%${filters.county}%`);
    if (filters.state) q = q.eq("state", filters.state);
    if (filters.zip) q = q.ilike("zip", `%${filters.zip}%`);

    const { data, error } = await q.order(sortBy, { ascending: true }).limit(50);
    if (error) throw error;
    return (data ?? []) as CondoProjectSummary[];
  }

  // DEMO mode — filter the mock set in memory.
  const match = (value: string | null, needle?: string) =>
    !needle || (value ?? "").toLowerCase().includes(needle.toLowerCase());

  const results = MOCK_PROJECTS.filter(
    (p) =>
      match(p.project_name, filters.condo_name) &&
      match(p.condo_id, filters.condo_id) &&
      match(p.city, filters.city) &&
      match(p.county, filters.county) &&
      (!filters.state || p.state === filters.state) &&
      match(p.zip, filters.zip)
  ).map(toSummary);

  return results.sort((a, b) =>
    String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""))
  );
}

// Full questionnaire detail. In production this is the billable "lookup" —
// call AFTER the user confirms, and record the spend for the audit trail.
export async function getProject(id: string): Promise<CondoProjectDetail | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("condo_projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return (data ?? null) as CondoProjectDetail | null;
  }

  return MOCK_PROJECTS.find((p) => p.id === id) ?? null;
}
