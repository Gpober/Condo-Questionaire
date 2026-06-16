"use server";

import { searchProjects } from "@/lib/projects";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { SearchFilters, SortField, CondoSummary } from "@/lib/types";

export type SearchResponse = { results: CondoSummary[]; error: string | null };

export async function searchAction(
  filters: SearchFilters,
  sortBy: SortField
): Promise<SearchResponse> {
  try {
    const results = await searchProjects(filters, sortBy);
    return { results, error: null };
  } catch (e: any) {
    // The base URL is not secret (it's in the client bundle); log it to confirm
    // exactly what's being requested when diagnosing path errors.
    console.error("searchAction failed (base URL:", SUPABASE_URL, "):", e);
    return { results: [], error: e?.message ?? "Search failed. Please try again." };
  }
}
