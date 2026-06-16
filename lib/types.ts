// Domain model — matches the real `condo_projects` table in Supabase.

export interface CondoProject {
  id: number;
  state: string | null;
  county: string | null;
  project_name: string;
  zip_code: string | null;
  budget_expiration: string | null; // ISO date
  insurance_expiration: string | null; // ISO date
  questionnaire_expiration: string | null; // ISO date
  condo_review: string | null; // review status / determination
  review_date: string | null; // ISO date
  source_file: string | null;
  list_refreshed: string | null; // ISO date
  created_at: string | null;
}

// Search form mirrors the intake screen, aligned to columns that actually exist.
// (City was dropped — the table has county, not city.)
export interface SearchFilters {
  project_name?: string; // "Condo Name"
  condo_id?: string; // matches the numeric id
  county?: string;
  state?: string;
  zip_code?: string;
}

// "Sorted By" options — only columns that make sense to sort on.
export type SortField = "project_name" | "state" | "zip_code" | "county";

// Non-sensitive summary returned by the public search RPC. The paid fields
// (condo_review, expirations, etc.) are intentionally NOT included here.
export interface CondoSummary {
  id: number;
  project_name: string;
  county: string | null;
  state: string | null;
  zip_code: string | null;
}

// A row from blacklisted_projects.
export interface BlacklistEntry {
  id: number;
  project_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  project_legal_name: string | null;
  status: string | null;
  date_text: string | null;
  scope: string | null;
}

// A condo project annotated with any blacklist match found for it.
export type SearchResult = CondoProject & { blacklist: BlacklistEntry | null };
