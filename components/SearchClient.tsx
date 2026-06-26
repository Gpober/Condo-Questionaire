"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { searchAction } from "@/app/actions";
import { US_STATES, stateName } from "@/lib/states";
import { SearchFilters, SortField, CondoSummary } from "@/lib/types";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import AuthModal from "@/components/AuthModal";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "project_name", label: "Condo Name" },
  { value: "state", label: "State" },
  { value: "zip_code", label: "Zip Code" },
  { value: "county", label: "County" },
];

export default function SearchClient() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<SortField>("project_name");
  const [results, setResults] = useState<CondoSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CondoSummary | null>(null);
  // The state filter that produced the current results (snapshotted at search
  // time so the count label doesn't change if the dropdown is edited after).
  const [searchedState, setSearchedState] = useState<string>("");
  // Sign-in state gates the results list: anonymous visitors see a blurred list
  // behind a free-account popup; once signed in the list unblurs.
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSignedIn(localStorage.getItem("cq_auth") === "1");
      return;
    }
    const supabase = getBrowserClient()!;
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  function openAuth(mode: "signup" | "signin") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

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
      setSearchedState(filters.state ?? "");
    } catch (err: any) {
      setError(err?.message ?? "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function confirmProceed() {
    if (!selected) return;
    // Auth + the credit paywall are enforced on the project page itself.
    router.push(`/project/${selected.id}`);
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
        <div className="form-grid">
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
              <p className="results-count">
                {searchedState ? `${stateName(searchedState)} — ` : ""}
                <strong>{results.length.toLocaleString()}</strong> condo communit
                {results.length === 1 ? "y" : "ies"} found. Tap one to view details.
              </p>
              <div className="results-wrap">
                <div className={signedIn ? undefined : "results-blur"}>
                  {results.map((p) => (
                    <div
                      key={p.id}
                      className="result-row"
                      onClick={() => (signedIn ? setSelected(p) : openAuth("signup"))}
                    >
                      <div>
                        <div className="name">{p.project_name}</div>
                        <div className="addr">
                          {[p.county && `${p.county} County`, p.state, p.zip_code].filter(Boolean).join(" · ")}
                          {`  ·  ID ${p.id}`}
                        </div>
                      </div>
                      <span className="chev">→</span>
                    </div>
                  ))}
                </div>

                {!signedIn && (
                  <div className="results-gate" onClick={() => openAuth("signup")}>
                    <div className="results-gate-card" onClick={(e) => e.stopPropagation()}>
                      <h3>Unlock the full list</h3>
                      <p>
                        Create a free account to view all{" "}
                        <strong>{results.length.toLocaleString()}</strong>{" "}
                        {searchedState ? `${stateName(searchedState)} ` : ""}
                        condo communit{results.length === 1 ? "y" : "ies"}.
                      </p>
                      <button className="btn" onClick={() => openAuth("signup")}>
                        Create free account
                      </button>
                      <p className="hint" style={{ marginTop: 12 }}>
                        Already have an account?{" "}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            openAuth("signin");
                          }}
                        >
                          Sign in
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- Confirmation modal ---- */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>View this record?</h3>
            <p className="muted" style={{ fontSize: 14 }}>
              Opening the full cached record for{" "}
              <strong>{selected.project_name}</strong>
              {selected.state ? ` (${selected.county ? selected.county + ", " : ""}${selected.state})` : ""}{" "}
              costs <strong>1 credit</strong>. You&apos;ll confirm on the next screen, and can view it
              again later for free.
            </p>
            <div className="actions">
              <button className="btn secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn" onClick={confirmProceed}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Sign-up / sign-in popup (gates the results list) ---- */}
      {authOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthOpen(false)}
          onSignedIn={() => {
            setSignedIn(true);
            setAuthOpen(false);
          }}
        />
      )}
    </div>
  );
}
