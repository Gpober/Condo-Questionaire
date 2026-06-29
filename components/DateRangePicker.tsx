"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { RANGE_PRESETS } from "@/lib/analytics-range";

// Preset chips + a custom from/to picker. Preserves other query params
// (e.g. the drill-down metric/value) while swapping the date range.
export default function DateRangePicker({
  preset,
  from,
  to,
}: {
  preset: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [cFrom, setCFrom] = useState(from);
  const [cTo, setCTo] = useState(to);

  function go(params: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    next.delete("range");
    next.delete("from");
    next.delete("to");
    for (const [k, v] of Object.entries(params)) next.set(k, v);
    router.push(`${pathname}?${next.toString()}`);
  }

  const chip = (active: boolean) => ({
    padding: "6px 12px",
    fontSize: 13,
    opacity: active ? 1 : 0.6,
    fontWeight: active ? 700 : 500,
  });
  const dateInput = {
    padding: "6px 8px",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 13,
    width: "auto" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {RANGE_PRESETS.map((p) => (
          <button key={p.key} className="btn" style={chip(preset === p.key)} onClick={() => go({ range: p.key })}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <input type="date" value={cFrom} max={cTo || undefined} onChange={(e) => setCFrom(e.target.value)} style={dateInput} />
        <span className="muted" style={{ fontSize: 13 }}>→</span>
        <input type="date" value={cTo} min={cFrom || undefined} onChange={(e) => setCTo(e.target.value)} style={dateInput} />
        <button
          className="btn"
          style={chip(preset === "custom")}
          onClick={() => {
            if (cFrom && cTo) go({ from: cFrom, to: cTo });
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
