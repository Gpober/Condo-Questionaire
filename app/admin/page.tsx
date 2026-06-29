import Link from "next/link";
import TopBar from "@/components/TopBar";
import AdminLeads from "@/components/AdminLeads";
import { isAdmin, getLeads, getMembers } from "@/lib/admin";
import { getReviewSummary } from "@/lib/reviews";
import AuditExport from "@/components/AuditExport";
import { formatUSD } from "@/lib/stripe/config";

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
  const members = await getMembers();
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1>Admin</h1>
            <p>Lead CRM and condo data-audit progress.</p>
          </div>
          <Link href="/admin/analytics" className="btn">📊 Analytics</Link>
        </div>

        {/* ---- Data audit summary ---- */}
        <div className="card" style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Data audit</h3>
            <AuditExport needsList={audit.needsList} expired={audit.expired} />
          </div>

          <div className="audit-stats" style={{ marginTop: 14 }}>
            <div className="audit-stat">
              <span className="audit-num verified">{audit.verified.toLocaleString()}</span>
              <span className="audit-label">Verified ✓</span>
            </div>
            <div className="audit-stat">
              <span className="audit-num needs">{audit.needsFixing.toLocaleString()}</span>
              <span className="audit-label">Need fixing ⚠</span>
            </div>
            {audit.total > 0 && (
              <div className="audit-stat">
                <span className="audit-num">{audit.total.toLocaleString()}</span>
                <span className="audit-label">Total records</span>
              </div>
            )}
          </div>

          {audit.total > 0 && (
            <div className="audit-progress-wrap">
              <div className="audit-progress-head">
                <span>Verified progress</span>
                <span>{Math.round((audit.verified / audit.total) * 100)}% ({audit.verified.toLocaleString()} / {audit.total.toLocaleString()})</span>
              </div>
              <div className="audit-progress">
                <div
                  className="audit-progress-bar"
                  style={{ width: `${Math.min(100, (audit.verified / audit.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Auto-detected stale records (expirations passed) */}
          <p className="muted" style={{ fontSize: 13, margin: "20px 0 8px", fontWeight: 600 }}>
            Auto-flagged: expired / stale records{" "}
            <span className="review-pill needs" style={{ marginLeft: 6 }}>
              {audit.expired.length}{audit.expiredCapped ? "+" : ""}
            </span>
          </p>
          {audit.expired.length > 0 ? (
            <div className="audit-list">
              {audit.expired.map((it) => (
                <Link key={it.project_id} href={`/project/${it.project_id}`} className="audit-row">
                  <div>
                    <div className="name">{it.project_name} {it.state ? `· ${it.state}` : ""}</div>
                    <div className="audit-note">Expired: {it.expired.join(" · ")}</div>
                  </div>
                  <span className="chev">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              {audit.total > 0
                ? "No expired questionnaire/budget/insurance dates found. 🎉"
                : "Connect the service-role key to auto-detect expired records (see notes)."}
            </p>
          )}

          {/* Manually flagged needs-fixing */}
          <p className="muted" style={{ fontSize: 13, margin: "20px 0 8px", fontWeight: 600 }}>
            Manually flagged: needs fixing
          </p>
          {audit.needsList.length > 0 ? (
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
          ) : (
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
              Nothing manually flagged yet. Use “Needs fixing” on any condo&apos;s page while you audit.
            </p>
          )}
        </div>

        {/* ---- Members (everyone who created a login) ---- */}
        <div className="page-head" style={{ marginTop: 30 }}>
          <h2 style={{ margin: 0 }}>Members</h2>
          <p>Everyone who created a login ({members.length.toLocaleString()}) — with credit balance and purchase history.</p>
        </div>
        {members.length > 0 ? (
          <div style={{ overflowX: "auto", marginBottom: 30 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Last sign-in</th>
                  <th style={{ textAlign: "right" }}>Credits</th>
                  <th style={{ textAlign: "right" }}>Purchases</th>
                  <th style={{ textAlign: "right" }}>Spent</th>
                  <th>Last purchase</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const num = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };
                  return (
                    <tr key={m.id}>
                      <td>{m.name ?? "—"}</td>
                      <td>{m.email ?? "—"}</td>
                      <td>{fmt(m.created_at)}</td>
                      <td>{fmt(m.last_sign_in_at)}</td>
                      <td style={num}>{m.credit_balance.toLocaleString()}</td>
                      <td style={num}>{m.purchases.toLocaleString()}</td>
                      <td style={num}>{m.total_spent_cents > 0 ? formatUSD(m.total_spent_cents) : "—"}</td>
                      <td>{fmt(m.last_purchase_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 30 }}>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              No members to show yet — or the <code>SUPABASE_SERVICE_ROLE_KEY</code> isn&apos;t set in
              your hosting env, which is required to list login accounts.
            </p>
          </div>
        )}

        <div className="page-head">
          <h2 style={{ margin: 0 }}>Leads</h2>
          <p>Everyone who submitted the “What’s Next” form. Update status as you work them.</p>
        </div>
        <AdminLeads leads={leads} />
      </div>
    </>
  );
}
