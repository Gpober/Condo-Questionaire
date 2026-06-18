"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadStatus } from "@/lib/types";
import { updateLeadStatusAction } from "@/app/actions/admin";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "closed"];

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "#2563eb",
  contacted: "#d97706",
  qualified: "#008e97",
  converted: "#16a34a",
  closed: "#64748b",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminLeads({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(leads);
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [busy, setBusy] = useState<number | null>(null);

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: leads.filter((l) => l.status === s).length }),
    {} as Record<LeadStatus, number>
  );

  const shown = filter === "all" ? rows : rows.filter((l) => l.status === filter);

  async function changeStatus(id: number, status: LeadStatus) {
    setBusy(id);
    setRows((rs) => rs.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await updateLeadStatusAction(id, status);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 22 }}>
        <button className="card" onClick={() => setFilter("all")} style={{ cursor: "pointer", textAlign: "left", border: filter === "all" ? "2px solid var(--brand)" : undefined }}>
          <div className="k">All</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{leads.length}</div>
        </button>
        {STATUSES.map((s) => (
          <button key={s} className="card" onClick={() => setFilter(s)} style={{ cursor: "pointer", textAlign: "left", border: filter === s ? "2px solid var(--brand)" : undefined }}>
            <div className="k" style={{ color: STATUS_COLOR[s] }}>{s}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{counts[s]}</div>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="muted">No leads {filter === "all" ? "yet" : `with status "${filter}"`}.</p>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Project</th>
                <th>State</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                  <td style={{ fontWeight: 600 }}>{l.full_name}</td>
                  <td>
                    <a href={`mailto:${l.email}`}>{l.email}</a>
                    {l.phone && <div className="muted" style={{ fontSize: 13 }}>{l.phone}</div>}
                  </td>
                  <td>{l.project_name ?? "—"}</td>
                  <td>{l.state ?? "—"}</td>
                  <td style={{ maxWidth: 220 }} className="muted">{l.notes ?? "—"}</td>
                  <td>
                    <select
                      value={l.status}
                      disabled={busy === l.id}
                      onChange={(e) => changeStatus(l.id, e.target.value as LeadStatus)}
                      style={{ padding: "7px 10px", borderRadius: 9, fontWeight: 700, color: STATUS_COLOR[l.status] }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} style={{ color: "#0f172a" }}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
