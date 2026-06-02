"use server";

import { searchProjects } from "@/lib/projects";
import { annotateBlacklist } from "@/lib/blacklist";
import { SearchFilters, SortField, SearchResult } from "@/lib/types";

export async function searchAction(
  filters: SearchFilters,
  sortBy: SortField
): Promise<SearchResult[]> {
  const projects = await searchProjects(filters, sortBy);
  return annotateBlacklist(projects);
}
