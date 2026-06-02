"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchAction } from "@/app/actions";
import { US_STATES } from "@/lib/states";
import { CondoProjectSummary, SearchFilters, SortField } from "@/lib/types";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "project_name", label: "Condo Name" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip", label: "Zip Code" },
];

function WarrantabilityBadge({ p }: { p: CondoProjectSummary }) {
  if (p.blacklisted) return <span className="badge blacklist">Blacklisted</span>;
  return <span className={`badge ${p.warrantability}`}>{p.warrantability.replace("_", "-")}</span>;
}

export default function SearchClient() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SortField>("project_name");
  const [results, setResults] = useState<CondoProjectSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CondoProjectSummary | null>(null);

  const set = (k: keyof SearchFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await searchAction(filters, sortBy);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  function confirmProceed() {
    if (!selected) return;
    // The confirmed=1 flag marks this as an intentional, billable lookup.
    router.push(`/project/${selected.id}?confirmed=1`);
  }

  return (
    <div>
      {/* ---- Search form ---- */}
      <form className="card" onSubmit={onSearch}>
        <div className="kv" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginTop: 0 }}>
          <div>
            <label>Sorted By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)" }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>State</label>
            <select
              value={filters.state ?? ""}
              onChange={set("state")}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)" }}
            >
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
            <input type="text" value={filters.condo_id ?? ""} onChange={set("condo_id")} />
          </div>
          <div>
            <label>Condo Name</label>
            <input type="text" value={filters.condo_name ?? ""} onChange={set("condo_name")} />
          </div>
          <div>
            <label>City</label>
            <input type="text" value={filters.city ?? ""} onChange={set("city")} />
          </div>
          <div>
            <label>Zip Code</label>
            <input type="text" value={filters.zip ?? ""} onChange={set("zip")} />
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {/* ---- Results ---- */}
      {results && (
        <div style={{ marginTop: 24 }}>
          {results.length === 0 ? (
            <p className="muted">No matching condo projects found. Try fewer or broader filters.</p>
          ) : (
            <>
              <p className="muted" style={{ marginBottom: 12 }}>
                {results.length} match{results.length === 1 ? "" : "es"} — click one to view its cached questionnaire.
              </p>
              {results.map((p) => (
                <div key={p.id} className="result-row" onClick={() => setSelected(p)}>
                  <div>
                    <div className="name">{p.project_name}</div>
                    <div className="addr">
                      {[p.address, p.city, p.county && `${p.county} County`, p.state, p.zip]
                        .filter(Boolean)
                        .join(" · ")}
                      {p.condo_id ? `  ·  ID ${p.condo_id}` : ""}
                    </div>
                  </div>
                  <WarrantabilityBadge p={p} />
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
              You&apos;re about to open the full cached questionnaire for{" "}
              <strong>{selected.project_name}</strong>
              {selected.city ? ` (${selected.city}, ${selected.state})` : ""}. This counts as one lookup.
            </p>
            {selected.blacklisted && (
              <div className="banner danger" style={{ marginTop: 8 }}>
                ⚠ This project is on the blacklist. Review carefully before relying on it.
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
