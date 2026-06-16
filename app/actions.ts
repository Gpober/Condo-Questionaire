"use server";

import { searchProjects } from "@/lib/projects";
import { annotateBlacklist } from "@/lib/blacklist";
import { SearchFilters, SortField, SearchResult } from "@/lib/types";

export type SearchResponse = { results: SearchResult[]; error: string | null };

export async function searchAction(
  filters: SearchFilters,
  sortBy: SortField
): Promise<SearchResponse> {
  try {
    const projects = await searchProjects(filters, sortBy);
    const results = await annotateBlacklist(projects);
    return { results, error: null };
  } catch (e: any) {
    // Surface a readable message to the client; production redacts thrown errors.
    console.error("searchAction failed:", e);
    return { results: [], error: e?.message ?? "Search failed. Please try again." };
  }
}
