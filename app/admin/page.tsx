import Link from "next/link";
import TopBar from "@/components/TopBar";
import AdminLeads from "@/components/AdminLeads";
import { isAdmin, getLeads } from "@/lib/admin";
import { getReviewSummary } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await isAdmin();

  if (!admin) {
    return (
      <>
        <TopBar />
        <div className="container narrow">
          <div className="card glow" style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <h2 style={{ marginTop: 8 }}>Admins only</h2>
            <p className="muted">
              This area is restricted. If you should have access, ask to be added to the admins list.
            </p>
            <Link href="/" className="btn" style={{ marginTop: 8 }}>Back to home</Link>
          </div>
        </div>
      </>
    );
  }

  const leads = await getLeads();
  const audit = await getReviewSummary();

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Admin</h1>
          <p>Lead CRM and condo data-audit progress.</p>
        </div>

        {/* ---- Data audit summary ---- */}
        <div className="card" style={{ marginBottom: 26 }}>
          <h3 style={{ marginTop: 0 }}>Data audit</h3>
          <div className="audit-stats">
            <div className="audit-stat">
              <span className="audit-num verified">{audit.verified.toLocaleString()}</span>
              <span className="audit-label">Verified ✓</span>
            </div>
            <div className="audit-stat">
              <span className="audit-num needs">{audit.needsFixing.toLocaleString()}</span>
              <span className="audit-label">Need fixing ⚠</span>
            </div>
          </div>

          {audit.needsList.length > 0 ? (
            <>
              <p className="muted" style={{ fontSize: 13, margin: "18px 0 8px" }}>
                Records you flagged — click to open and fix:
              </p>
              <div className="audit-list">
                {audit.needsList.map((it) => (
                  <Link key={it.project_id} href={`/project/${it.project_id}`} className="audit-row">
                    <div>
                      <div className="name">{it.project_name}</div>
                      {it.note && <div className="audit-note">“{it.note}”</div>}
                    </div>
                    <span className="chev">→</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
              Nothing flagged as needing fixing. Mark records from any condo&apos;s page while you audit.
            </p>
          )}
        </div>

        <div className="page-head">
          <h2 style={{ margin: 0 }}>Leads</h2>
          <p>Everyone who submitted the “What’s Next” form. Update status as you work them.</p>
        </div>
        <AdminLeads leads={leads} />
      </div>
    </>
  );
}
