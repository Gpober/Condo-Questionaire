// Domain model for a condo project / questionnaire record.
// NOTE: these fields are a best-guess of the `condo_projects` table. Once we have
// the real Supabase schema, adjust this type and the mappers in lib/projects.ts.

export type Warrantability = "warrantable" | "non_warrantable" | "unknown";

export interface CondoProjectSummary {
  id: string;
  condo_id: string | null; // business-facing project ID (distinct from PK)
  project_name: string;
  address: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip: string | null;
  warrantability: Warrantability;
  blacklisted: boolean;
  last_updated: string | null; // ISO date of the cached questionnaire
}

// Search form mirrors the intake screen: filter fields + a sort selector.
export interface SearchFilters {
  condo_name?: string;
  condo_id?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
}

// "Sorted By" options — Condo ID and County are intentionally NOT sortable.
export type SortField = "project_name" | "city" | "state" | "zip";

export interface CondoProjectDetail extends CondoProjectSummary {
  hoa_name: string | null;
  management_company: string | null;
  total_units: number | null;
  units_sold_pct: number | null;
  owner_occupied_pct: number | null;
  investor_owned_pct: number | null;
  single_entity_ownership_pct: number | null;
  delinquency_pct: number | null; // % of units 60+ days past due on HOA dues
  reserve_funded_pct: number | null;
  litigation: boolean | null;
  litigation_notes: string | null;
  commercial_space_pct: number | null;
  master_insurance: boolean | null;
  questionnaire_source: string | null; // who completed it
  notes: string | null;
}
