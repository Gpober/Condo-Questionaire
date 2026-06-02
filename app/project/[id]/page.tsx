import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import TopBar from "@/components/TopBar";
import { getProject } from "@/lib/projects";
import { CondoProjectDetail } from "@/lib/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="k">{label}</div>
      <div className="v">{value ?? "—"}</div>
    </div>
  );
}

const pct = (n: number | null) => (n === null || n === undefined ? "—" : `${n}%`);
const yn = (b: boolean | null) => (b === null ? "—" : b ? "Yes" : "No");

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

  const p: CondoProjectDetail | null = await getProject(params.id);
  if (!p) notFound();

  return (
    <AuthGuard>
      <TopBar />
      <div className="container">
        <Link href="/search" className="muted">← Back to search</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <h1 style={{ margin: 0 }}>{p.project_name}</h1>
          {p.blacklisted ? (
            <span className="badge blacklist">Blacklisted</span>
          ) : (
            <span className={`badge ${p.warrantability}`}>{p.warrantability.replace("_", "-")}</span>
          )}
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          {[p.address, p.city, p.county && `${p.county} County`, p.state, p.zip].filter(Boolean).join(" · ")}
          {p.condo_id ? `  ·  Condo ID ${p.condo_id}` : ""}
        </p>

        {p.blacklisted && (
          <div className="banner danger">
            ⚠ This project is blacklisted. {p.litigation_notes || p.notes}
          </div>
        )}

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cached questionnaire</h3>
          <p className="muted" style={{ marginTop: -6, fontSize: 13 }}>
            Last updated {p.last_updated ?? "unknown"}
            {p.questionnaire_source ? ` · source: ${p.questionnaire_source}` : ""}
          </p>
          <div className="kv">
            <Field label="HOA name" value={p.hoa_name} />
            <Field label="Management company" value={p.management_company} />
            <Field label="Total units" value={p.total_units ?? "—"} />
            <Field label="Units sold" value={pct(p.units_sold_pct)} />
            <Field label="Owner-occupied" value={pct(p.owner_occupied_pct)} />
            <Field label="Investor-owned" value={pct(p.investor_owned_pct)} />
            <Field label="Single-entity ownership" value={pct(p.single_entity_ownership_pct)} />
            <Field label="HOA delinquency (60+ days)" value={pct(p.delinquency_pct)} />
            <Field label="Reserves funded" value={pct(p.reserve_funded_pct)} />
            <Field label="Commercial space" value={pct(p.commercial_space_pct)} />
            <Field label="Master insurance" value={yn(p.master_insurance)} />
            <Field label="Active litigation" value={yn(p.litigation)} />
          </div>
          {p.notes && (
            <p style={{ marginTop: 18 }}>
              <span className="k">Notes</span>
              <br />
              {p.notes}
            </p>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
