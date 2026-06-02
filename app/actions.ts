"use server";

import { searchProjects } from "@/lib/projects";
import { SearchFilters, SortField } from "@/lib/types";

export async function searchAction(filters: SearchFilters, sortBy: SortField) {
  return searchProjects(filters, sortBy);
}
