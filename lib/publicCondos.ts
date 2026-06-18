import { requireServerClient } from "./supabase/server";
import { CondoSummary, PublicCondo, WarrantabilityStatus } from "./types";

// PostgREST caps each response (default 1000 rows); page through for listings.
const PAGE_SIZE = 1000;

// One project for the PUBLIC, indexable page: name + location + coarse status.
// The expirations / review text / source docs stay behind the credit paywall.
export async function getPublicCondo(id: string): Promise<PublicCondo | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;

  const supabase = requireServerClient();

  // Preferred path: the security-definer RPC computes the coarse status
  // server-side so the raw review/dates never leave the database.
  const { data, error } = await supabase
    .rpc("public_condo_status", { p_condo_id: numId })
    .maybeSingle();
  if (!error && data) {
    const d = data as PublicCondo & { status: string };
    return {
      id: d.id,
      project_name: d.project_name,
      county: d.county,
      state: d.state,
      zip_code: d.zip_code,
      status: (d.status as WarrantabilityStatus) ?? "unknown",
    };
  }
  if (error) {
    // RPC not deployed yet (or failed): fall back to the public summary RPC
    // with an "unknown" status so the page still renders.
    console.error("public_condo_status failed:", error.message);
    const { data: rows } = await supabase
      .rpc("search_condos", {
        p_state: null,
        p_county: null,
        p_project_name: null,
        p_zip: null,
        p_condo_id: numId,
      })
      .limit(1);
    const s = ((rows ?? []) as CondoSummary[])[0];
    return s ? { ...s, status: "unknown" } : null;
  }
  return null;
}

// All public condo summaries (capped) — used to build the sitemap and the
// crawlable directory index. Returns only non-sensitive summary columns. Never
// throws: a missing/unreachable database yields an empty list so static
// generation of the sitemap/directory doesn't fail.
export async function listPublicCondoSummaries(
  limit = 5000
): Promise<CondoSummary[]> {
  try {
    const supabase = requireServerClient();
    const all: CondoSummary[] = [];
    for (let from = 0; from < limit; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .rpc("search_condos", {
          p_state: null,
          p_county: null,
          p_project_name: null,
          p_zip: null,
          p_condo_id: null,
        })
        .order("project_name", { ascending: true })
        .order("id", { ascending: true })
        .range(from, Math.min(from + PAGE_SIZE, limit) - 1);
      if (error) {
        console.error("listPublicCondoSummaries failed:", error.message);
        break;
      }
      const rows = (data ?? []) as CondoSummary[];
      all.push(...rows);
      if (rows.length < PAGE_SIZE) break;
    }
    return all;
  } catch (e) {
    console.error("listPublicCondoSummaries failed:", e);
    return [];
  }
}
