import Link from "next/link";
import TopBar from "@/components/TopBar";
import AdminLeads from "@/components/AdminLeads";
import { isAdmin, getLeads } from "@/lib/admin";
import { getSubscribers } from "@/lib/subscribers";

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

  const [leads, subscribers] = await Promise.all([getLeads(), getSubscribers()]);

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Admin · Leads</h1>
          <p>Everyone who submitted the “What’s Next” form. Update status as you work them.</p>
        </div>
        <AdminLeads leads={leads} />

        <div className="page-head" style={{ marginTop: 44 }}>
          <h1>Marketing list</h1>
          <p>Emails captured from the free search and condo pages. {subscribers.length} total.</p>
        </div>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          {subscribers.length === 0 ? (
            <p className="muted" style={{ padding: 18 }}>No subscribers yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.email}</td>
                    <td>{s.source ?? "—"}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
