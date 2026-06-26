import { getServerClient } from "./supabase/server";
import { getAdminClient } from "./supabase/admin";

export type ReviewStatus = "verified" | "needs_fixing";

export interface RecordReview {
  project_id: number;
  status: ReviewStatus;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string;
}

// Current audit status for a project (null if never reviewed).
export async function getRecordReview(projectId: string): Promise<RecordReview | null> {
  const supabase = getServerClient();
  if (!supabase) return null; // demo mode
  const { data, error } = await supabase
    .from("record_reviews")
    .select("*")
    .eq("project_id", Number(projectId))
    .maybeSingle();
  if (error) {
    console.error("getRecordReview failed:", error.message);
    return null;
  }
  return (data ?? null) as RecordReview | null;
}

export interface NeedsFixingItem {
  project_id: number;
  project_name: string;
  note: string | null;
  reviewed_by: string | null;
  reviewed_at: string;
}

export interface ReviewSummary {
  verified: number;
  needsFixing: number;
  needsList: NeedsFixingItem[];
}

// Audit summary for the admin dashboard: counts + the needs-fixing worklist.
export async function getReviewSummary(): Promise<ReviewSummary> {
  const empty: ReviewSummary = { verified: 0, needsFixing: 0, needsList: [] };
  const supabase = getServerClient();
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from("record_reviews")
    .select("project_id,status,note,reviewed_by,reviewed_at")
    .order("reviewed_at", { ascending: false });
  if (error) {
    console.error("getReviewSummary failed:", error.message);
    return empty;
  }

  const rows = (data ?? []) as RecordReview[];
  const verified = rows.filter((r) => r.status === "verified").length;
  const needs = rows.filter((r) => r.status === "needs_fixing");

  // Enrich the needs-fixing rows with project names (service-role read, since
  // condo_projects isn't directly selectable under RLS). Falls back to the ID.
  const names: Record<number, string> = {};
  const admin = getAdminClient();
  if (admin && needs.length) {
    const ids = needs.map((r) => r.project_id);
    const { data: projRows } = await admin
      .from("condo_projects")
      .select("id,project_name")
      .in("id", ids);
    for (const pr of projRows ?? []) {
      names[(pr as { id: number }).id] = (pr as { project_name: string }).project_name;
    }
  }

  const needsList: NeedsFixingItem[] = needs.map((r) => ({
    project_id: r.project_id,
    project_name: names[r.project_id] ?? `Condo ${r.project_id}`,
    note: r.note,
    reviewed_by: r.reviewed_by,
    reviewed_at: r.reviewed_at,
  }));

  return { verified, needsFixing: needs.length, needsList };
}
