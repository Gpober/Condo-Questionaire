"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchAction } from "@/app/actions";
import { US_STATES } from "@/lib/states";
import { SearchFilters, SortField, SearchResult } from "@/lib/types";
import { reviewTone, isExpired } from "@/lib/status";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "project_name", label: "Condo Name" },
  { value: "state", label: "State" },
  { value: "zip_code", label: "Zip Code" },
  { value: "county", label: "County" },
];

function StatusBadge({ p }: { p: SearchResult }) {
  if (p.blacklist) return <span className="badge blacklist">Blacklisted</span>;
  const tone = reviewTone(p.condo_review);
  const cls = tone === "ok" ? "warrantable" : tone === "bad" ? "non_warrantable" : "unknown";
  return <span className={`badge ${cls}`}>{p.condo_review ?? "No review"}</span>;
}

export default function SearchClient() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SortField>("project_name");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const set = (k: keyof SearchFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { results, error } = await searchAction(filters, sortBy);
      if (error) setError(error);
      setResults(results);
    } catch (err: any) {
      setError(err?.message ?? "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function confirmProceed() {
    if (!selected) return;
    // The confirmed=1 flag marks this as an intentional, billable lookup.
    router.push(`/project/${selected.id}?confirmed=1`);
  }

  const selectStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
  } as const;

  return (
    <div>
      {/* ---- Search form ---- */}
      <form className="card" onSubmit={onSearch}>
        <div className="kv" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginTop: 0 }}>
          <div>
            <label>Sorted By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortField)} style={selectStyle}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>State</label>
            <select value={filters.state ?? ""} onChange={set("state")} style={selectStyle}>
              <option value="">Any</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label>County</label>
            <input type="text" value={filters.county ?? ""} onChange={set("county")} />
          </div>
          <div>
            <label>Condo ID</label>
            <input type="text" inputMode="numeric" value={filters.condo_id ?? ""} onChange={set("condo_id")} />
          </div>
          <div>
            <label>Condo Name</label>
            <input type="text" value={filters.project_name ?? ""} onChange={set("project_name")} />
          </div>
          <div>
            <label>Zip Code</label>
            <input type="text" value={filters.zip_code ?? ""} onChange={set("zip_code")} />
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {error && <div className="banner danger" style={{ marginTop: 16 }}>{error}</div>}

      {/* ---- Results ---- */}
      {results && (
        <div style={{ marginTop: 24 }}>
          {results.length === 0 ? (
            <p className="muted">No matching condo projects found. Try fewer or broader filters.</p>
          ) : (
            <>
              <p className="muted" style={{ marginBottom: 12 }}>
                {results.length} match{results.length === 1 ? "" : "es"} — click one to view its cached record.
              </p>
              {results.map((p) => (
                <div key={p.id} className="result-row" onClick={() => setSelected(p)}>
                  <div>
                    <div className="name">{p.project_name}</div>
                    <div className="addr">
                      {[p.county && `${p.county} County`, p.state, p.zip_code].filter(Boolean).join(" · ")}
                      {`  ·  ID ${p.id}`}
                      {isExpired(p.questionnaire_expiration) ? "  ·  ⚠ questionnaire expired" : ""}
                    </div>
                  </div>
                  <StatusBadge p={p} />
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ---- Double-confirmation modal ---- */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure you want to proceed?</h3>
            <p className="muted" style={{ fontSize: 14 }}>
              You&apos;re about to open the full cached record for{" "}
              <strong>{selected.project_name}</strong>
              {selected.state ? ` (${selected.county ? selected.county + ", " : ""}${selected.state})` : ""}. This counts as one lookup.
            </p>
            {selected.blacklist && (
              <div className="banner danger" style={{ marginTop: 8 }}>
                ⛔ This project is <strong>blacklisted</strong>
                {selected.blacklist.status ? ` (${selected.blacklist.status})` : ""}.
                {selected.blacklist.scope ? ` ${selected.blacklist.scope}` : ""}
              </div>
            )}
            {isExpired(selected.questionnaire_expiration) && (
              <div className="banner danger" style={{ marginTop: 8 }}>
                ⚠ The questionnaire for this project expired on {selected.questionnaire_expiration}. The cached copy may not be reusable.
              </div>
            )}
            <div className="actions">
              <button className="btn secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn" onClick={confirmProceed}>Yes, proceed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
