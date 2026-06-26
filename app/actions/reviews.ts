"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { ReviewStatus } from "@/lib/reviews";

// Admin-only: map of project_id -> review status for all reviewed records, so
// the search list can show verified / needs-fixing badges. Returns {} for
// non-admins. Only reviewed records have rows, so this stays small.
export async function getAdminReviewMapAction(): Promise<Record<number, ReviewStatus>> {
  if (!(await isAdmin())) return {};
  const supabase = getServerClient();
  if (!supabase) return {};
  const { data, error } = await supabase.from("record_reviews").select("project_id,status");
  if (error) {
    console.error("getAdminReviewMapAction failed:", error.message);
    return {};
  }
  const map: Record<number, ReviewStatus> = {};
  for (const r of data ?? []) {
    map[(r as { project_id: number }).project_id] = (r as { status: ReviewStatus }).status;
  }
  return map;
}

// Admin-only: set (or clear) a record's audit status.
export async function setRecordReviewAction(
  projectId: string,
  status: ReviewStatus | "clear",
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Not authorized." };

  const supabase = getServerClient();
  if (!supabase) return { ok: true }; // demo mode: pretend it saved

  if (status === "clear") {
    const { error } = await supabase
      .from("record_reviews")
      .delete()
      .eq("project_id", Number(projectId));
    if (error) return { ok: false, error: error.message };
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("record_reviews").upsert({
      project_id: Number(projectId),
      status,
      note: note.trim() ? note.trim() : null,
      reviewed_by: user?.email ?? null,
      reviewed_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/project/${projectId}`);
  return { ok: true };
}
