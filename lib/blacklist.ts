import { requireServerClient } from "./supabase/server";
import { BlacklistEntry, CondoProject, SearchResult } from "./types";

// Normalize a project name for fuzzy comparison: lowercase, drop common suffixes
// and punctuation, collapse whitespace.
function normalizeName(name: string | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(condominiums?|condos?|hoa|association|apartments?|lofts?|llc|inc|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function namesMatch(a: string | null, b: string | null): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

// Does this blacklist row apply to this condo project?
function matches(project: CondoProject, bl: BlacklistEntry): boolean {
  const stateOk =
    !!project.state && !!bl.state && project.state.toUpperCase() === bl.state.toUpperCase();
  if (!stateOk) return false;
  const nameOk = namesMatch(project.project_name, bl.project_legal_name);
  const zipOk = !!project.zip_code && !!bl.zip && project.zip_code.trim() === bl.zip.trim();
  return nameOk || zipOk;
}

async function fetchBlacklistForStates(states: string[]): Promise<BlacklistEntry[]> {
  const supabase = requireServerClient();
  let q = supabase.from("blacklisted_projects").select("*");
  if (states.length) q = q.in("state", states);
  const { data, error } = await q;
  if (error) {
    // A blacklist failure shouldn't break search — log and skip flagging.
    console.error("blacklist query failed:", error.message);
    return [];
  }
  return (data ?? []) as BlacklistEntry[];
}

// Annotate each project with its blacklist match (or null).
export async function annotateBlacklist(projects: CondoProject[]): Promise<SearchResult[]> {
  if (projects.length === 0) return [];
  const states = Array.from(
    new Set(projects.map((p) => p.state).filter((s): s is string => !!s))
  );
  const blacklist = await fetchBlacklistForStates(states);
  return projects.map((p) => ({
    ...p,
    blacklist: blacklist.find((bl) => matches(p, bl)) ?? null,
  }));
}

// Look up a blacklist match for a single project.
export async function getBlacklistFor(project: CondoProject): Promise<BlacklistEntry | null> {
  const blacklist = await fetchBlacklistForStates(project.state ? [project.state] : []);
  return blacklist.find((bl) => matches(project, bl)) ?? null;
}
