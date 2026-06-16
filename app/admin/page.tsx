import Link from "next/link";
import TopBar from "@/components/TopBar";
import AdminLeads from "@/components/AdminLeads";
import { isAdmin, getLeads } from "@/lib/admin";

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

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Admin · Leads</h1>
          <p>Everyone who submitted the “What’s Next” form. Update status as you work them.</p>
        </div>
        <AdminLeads leads={leads} />
      </div>
    </>
  );
}
