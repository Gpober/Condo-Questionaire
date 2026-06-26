"use client";

import { NeedsFixingItem, ExpiredItem } from "@/lib/reviews";

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AuditExport({
  needsList,
  expired,
}: {
  needsList: NeedsFixingItem[];
  expired: ExpiredItem[];
}) {
  function exportNeeds() {
    downloadCsv(
      "needs-fixing.csv",
      ["Condo ID", "Project name", "Note", "Flagged by", "Flagged at"],
      needsList.map((it) => [
        it.project_id,
        it.project_name,
        it.note ?? "",
        it.reviewed_by ?? "",
        it.reviewed_at ? new Date(it.reviewed_at).toISOString().slice(0, 10) : "",
      ]),
    );
  }

  function exportExpired() {
    downloadCsv(
      "expired-records.csv",
      ["Condo ID", "Project name", "State", "Expired"],
      expired.map((it) => [it.project_id, it.project_name, it.state ?? "", it.expired.join(" / ")]),
    );
  }

  return (
    <div className="audit-export">
      <button className="btn sm secondary" onClick={exportNeeds} disabled={needsList.length === 0}>
        ⬇ Needs-fixing CSV
      </button>
      <button className="btn sm secondary" onClick={exportExpired} disabled={expired.length === 0}>
        ⬇ Expired records CSV
      </button>
    </div>
  );
}
