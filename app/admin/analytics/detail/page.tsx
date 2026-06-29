import Link from "next/link";
import TopBar from "@/components/TopBar";
import DateRangePicker from "@/components/DateRangePicker";
import { isAdmin } from "@/lib/admin";
import { getEvents } from "@/lib/analytics";
import { resolveRange, rangeQuery } from "@/lib/analytics-range";
import { formatUSD } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function resolveMetric(metric: string, value: string): { filter: string; value: string | null; title: string } {
  switch (metric) {
    case "purchases":
    case "revenue":
    case "aov":
    case "conversion":
      return { filter: "purchase", value: null, title: "Purchases" };
    case "refunds":
      return { filter: "refund", value: null, title: "Refunds" };
    case "views":
      return { filter: "pageview", value: null, title: "Page views" };
    case "visitors":
      return { filter: "pageview", value: null, title: "Visitor activity" };
    case "channel":
      return { filter: "channel", value, title: `Channel · ${value}` };
    case "campaign":
      return { filter: "campaign", value, title: `Campaign · ${value}` };
    case "pack":
      return { filter: "pack", value, title: `Pack · ${value}` };
    case "path":
      return { filter: "path", value, title: `Page · ${value}` };
    case "country":
      return { filter: "country", value, title: `Country · ${value}` };
    case "device":
      return { filter: "device", value, title: `Device · ${value}` };
    case "browser":
      return { filter: "browser", value, title: `Browser · ${value}` };
    case "referrer":
      return { filter: "referrer", value, title: `Referrer · ${value}` };
    default:
      return { filter: "pageview", value: null, title: "Activity" };
  }
}

export default async function AnalyticsDetailPage({
  searchParams,
}: {
  searchParams: { metric?: string; value?: string | string[]; range?: string | string[]; from?: string | string[]; to?: string | string[] };
}) {
  const admin = await isAdmin();
  if (!admin) {
    return (
      <>
        <TopBar />
        <div className="container narrow">
          <div className="card glow" style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <h2 style={{ marginTop: 8 }}>Admins only</h2>
            <Link href="/" className="btn" style={{ marginTop: 8 }}>Back to home</Link>
          </div>
        </div>
      </>
    );
  }

  const range = resolveRange(searchParams);
  const metric = first(searchParams.metric) || "views";
  const value = first(searchParams.value);
  const { filter, value: filterValue, title } = resolveMetric(metric, value);
  const rows = await getEvents(filter, filterValue, range.fromISO, range.toISO, 500);

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const num = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>{title}</h1>
          <p>{range.label} · {rows.length.toLocaleString()} record{rows.length === 1 ? "" : "s"}</p>
          <DateRangePicker preset={range.preset} from={range.from} to={range.to} />
        </div>

        <div className="card">
          {rows.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: 0, textAlign: "center" }}>No records in this range.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Detail</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Channel</th>
                    <th>Device</th>
                    <th>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.created_at}-${i}`}>
                      <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.created_at)}</td>
                      <td>{cap(r.event)}</td>
                      <td>{r.email ?? "—"}</td>
                      <td title={r.path ?? ""}>{r.event === "pageview" ? r.path ?? "—" : r.label ?? r.path ?? "—"}</td>
                      <td style={num}>{r.amount_cents === null ? "—" : formatUSD(r.amount_cents)}</td>
                      <td>{r.channel ?? "—"}</td>
                      <td>{r.device ?? "—"}</td>
                      <td>{r.country ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 20, textAlign: "center" }}>
          <Link href={`/admin/analytics?${rangeQuery(range)}`}>← Back to analytics</Link>
        </p>
      </div>
    </>
  );
}
