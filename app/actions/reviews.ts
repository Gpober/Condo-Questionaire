"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { ReviewStatus } from "@/lib/reviews";

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
