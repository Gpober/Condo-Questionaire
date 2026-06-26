import { getServerClient } from "./supabase/server";

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
