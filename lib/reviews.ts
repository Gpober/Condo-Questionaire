import { getServerClient } from "./supabase/server";
import { getAdminClient } from "./supabase/admin";
import { isExpired } from "./status";

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

export interface ExpiredItem {
  project_id: number;
  project_name: string;
  state: string | null;
  expired: string[]; // which dates are expired, e.g. ["Questionnaire","Budget"]
}

export interface ReviewSummary {
  verified: number;
  needsFixing: number;
  total: number;            // total condo records (0 if not available)
  needsList: NeedsFixingItem[];
  expired: ExpiredItem[];   // auto-detected stale records (expirations passed)
  expiredCapped: boolean;   // true if the expired list hit its display cap
}

const EXPIRED_CAP = 100;

// Audit summary for the admin dashboard: counts, the needs-fixing worklist, and
// an automatic list of stale records (any expiration date in the past).
export async function getReviewSummary(): Promise<ReviewSummary> {
  const empty: ReviewSummary = {
    verified: 0,
    needsFixing: 0,
    total: 0,
    needsList: [],
    expired: [],
    expiredCapped: false,
  };
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

  // condo_projects isn't directly selectable under RLS, so name lookups, the
  // total count, and stale detection use the service-role client (server-only).
  const admin = getAdminClient();
  const names: Record<number, string> = {};
  let total = 0;
  let expired: ExpiredItem[] = [];
  let expiredCapped = false;

  if (admin) {
    if (needs.length) {
      const { data: projRows } = await admin
        .from("condo_projects")
        .select("id,project_name")
        .in("id", needs.map((r) => r.project_id));
      for (const pr of projRows ?? []) {
        names[(pr as { id: number }).id] = (pr as { project_name: string }).project_name;
      }
    }

    const { count } = await admin
      .from("condo_projects")
      .select("id", { count: "exact", head: true });
    total = count ?? 0;

    // Stale = any of the three expiration dates is in the past.
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { data: exp } = await admin
      .from("condo_projects")
      .select("id,project_name,state,questionnaire_expiration,budget_expiration,insurance_expiration")
      .or(
        `questionnaire_expiration.lt.${today},budget_expiration.lt.${today},insurance_expiration.lt.${today}`,
      )
      .limit(EXPIRED_CAP + 1);
    const expRows = (exp ?? []) as Array<{
      id: number;
      project_name: string;
      state: string | null;
      questionnaire_expiration: string | null;
      budget_expiration: string | null;
      insurance_expiration: string | null;
    }>;
    expiredCapped = expRows.length > EXPIRED_CAP;
    expired = expRows.slice(0, EXPIRED_CAP).map((r) => {
      const fields: string[] = [];
      if (isExpired(r.questionnaire_expiration)) fields.push("Questionnaire");
      if (isExpired(r.budget_expiration)) fields.push("Budget");
      if (isExpired(r.insurance_expiration)) fields.push("Insurance");
      return { project_id: r.id, project_name: r.project_name, state: r.state, expired: fields };
    }).filter((e) => e.expired.length > 0);
  }

  const needsList: NeedsFixingItem[] = needs.map((r) => ({
    project_id: r.project_id,
    project_name: names[r.project_id] ?? `Condo ${r.project_id}`,
    note: r.note,
    reviewed_by: r.reviewed_by,
    reviewed_at: r.reviewed_at,
  }));

  return { verified, needsFixing: needs.length, total, needsList, expired, expiredCapped };
}
