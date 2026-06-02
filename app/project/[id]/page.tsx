import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { getProject } from "@/lib/projects";
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
  searchParams,
}: {
  params: { id: string };
  searchParams: { confirmed?: string };
}) {
  // Gate: detail is only reachable after the double-confirmation step.
  if (searchParams.confirmed !== "1") {
    redirect("/search");
  }

  const p: CondoProject | null = await getProject(params.id);
  if (!p) notFound();

  const tone = reviewTone(p.condo_review);
  const badgeCls = tone === "ok" ? "warrantable" : tone === "bad" ? "non_warrantable" : "unknown";

  return (
    <AuthGuard>
      <TopBar />
      <div className="container">
        <Link href="/search" className="muted">← Back to search</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <h1 style={{ margin: 0 }}>{p.project_name}</h1>
          <span className={`badge ${badgeCls}`}>{p.condo_review ?? "No review"}</span>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          {[p.county && `${p.county} County`, p.state, p.zip_code].filter(Boolean).join(" · ")}
          {`  ·  Condo ID ${p.id}`}
        </p>

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
      </div>
    </AuthGuard>
  );
}
