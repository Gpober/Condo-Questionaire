import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import Paywall from "@/components/Paywall";
import { getProject, getCondoSummary } from "@/lib/projects";
import { getBlacklistFor } from "@/lib/blacklist";
import { getBalance } from "@/lib/credits";
import { isAdmin } from "@/lib/admin";
import { CondoProject } from "@/lib/types";
import { reviewTone, isExpired, expiryLabel } from "@/lib/status";

function Field({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div>
      <div className="k">{label}</div>
      <div className="v" style={warn ? { color: "var(--danger)" } : undefined}>{value ?? "—"}</div>
    </div>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  // Non-sensitive summary (for the name) is always available; the full record
  // is only returned by getProject() if the user has paid to unlock it.
  const summary = await getCondoSummary(params.id);
  if (!summary) notFound();

  const p: CondoProject | null = await getProject(params.id);

  // Paywall: getProject returns null until the user spends a credit to unlock.
  // Middleware already ensures the user is signed in for /project routes.
  if (!p) {
    const balance = await getBalance();
    return (
      <>
        <TopBar />
        <div className="container">
          <Link href="/search" className="muted">← Back to search</Link>
          <h1 style={{ marginTop: 12 }}>{summary.project_name}</h1>
          <Paywall projectId={params.id} projectName={summary.project_name} balance={balance} />
        </div>
      </>
    );
  }

  const admin = await isAdmin();
  const blacklist = await getBlacklistFor(p);
  const tone = reviewTone(p.condo_review);
  const badgeCls = tone === "ok" ? "warrantable" : tone === "bad" ? "non_warrantable" : "unknown";

  return (
    <>
      <TopBar />
      <div className="container">
        <Link href="/search" className="muted">← Back to search</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <h1 style={{ margin: 0 }}>{p.project_name}</h1>
          {blacklist ? (
            <span className="badge blacklist">Blacklisted</span>
          ) : (
            <span className={`badge ${badgeCls}`}>{p.condo_review ?? "No review"}</span>
          )}
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          {[p.county && `${p.county} County`, p.state, p.zip_code].filter(Boolean).join(" · ")}
          {`  ·  Condo ID ${p.id}`}
        </p>

        {admin && (
          <div className="banner demo" style={{ background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>
            ✅ Admin access — viewing this record for free (no credit charged).
          </div>
        )}

        {blacklist && (
          <div className="banner danger">
            ⛔ This project is <strong>blacklisted</strong>
            {blacklist.status ? ` — ${blacklist.status}` : ""}.
            {blacklist.scope ? ` ${blacklist.scope}` : ""}
            {blacklist.date_text ? ` (${blacklist.date_text})` : ""}
            {blacklist.project_legal_name ? ` · matched legal name: ${blacklist.project_legal_name}` : ""}
          </div>
        )}

        {isExpired(p.questionnaire_expiration) && (
          <div className="banner danger">
            ⚠ The questionnaire expired on {p.questionnaire_expiration}. A fresh questionnaire is likely required — the cached copy cannot be reused for a new loan.
          </div>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cached record</h3>
          <p className="muted" style={{ marginTop: -6, fontSize: 13 }}>
            Reviewed {p.review_date ?? "unknown"} · list refreshed {p.list_refreshed ?? "unknown"}
            {p.source_file ? ` · source: ${p.source_file}` : ""}
          </p>
          <div className="kv">
            <Field label="State" value={p.state} />
            <Field label="County" value={p.county} />
            <Field label="Zip code" value={p.zip_code} />
            <Field label="Condo review" value={p.condo_review} />
            <Field label="Review date" value={p.review_date} />
            <Field
              label="Questionnaire expiration"
              value={expiryLabel(p.questionnaire_expiration)}
              warn={isExpired(p.questionnaire_expiration)}
            />
            <Field
              label="Budget expiration"
              value={expiryLabel(p.budget_expiration)}
              warn={isExpired(p.budget_expiration)}
            />
            <Field
              label="Insurance expiration"
              value={expiryLabel(p.insurance_expiration)}
              warn={isExpired(p.insurance_expiration)}
            />
          </div>
        </div>

        {!blacklist && (
          <div className="cta-band" style={{ marginTop: 26 }}>
            <h2>On the list and approved?</h2>
            <p>Get matched with a recommended mortgage agent who can waive the questionnaire entirely.</p>
            <Link href="/next-steps" className="btn secondary lg">See what&apos;s next</Link>
          </div>
        )}
      </div>
    </>
  );
}
