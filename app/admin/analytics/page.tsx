import Link from "next/link";
import TopBar from "@/components/TopBar";
import { isAdmin } from "@/lib/admin";
import {
  getAnalyticsSummary,
  getAnalyticsDaily,
  getTopPaths,
  getTopReferrers,
  getTopCountries,
  getSalesByPack,
  type Tally,
} from "@/lib/analytics";
import { formatUSD } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

// Allow ?days=7 | 30 | 90 to change the window; default 30.
function parseDays(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return [7, 30, 90].includes(n) ? n : 30;
}

function TallyList({ rows }: { rows: Tally[] }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  if (rows.length === 0) {
    return <p className="muted" style={{ fontSize: 13, margin: 0 }}>No data yet.</p>;
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", minWidth: 0 }}>
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                width: `${(r.views / max) * 100}%`,
                background: "rgba(99,102,241,0.15)",
                borderRadius: 6,
              }}
            />
            <span
              style={{
                position: "relative",
                padding: "4px 8px",
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
              title={r.label}
            >
              {r.label}
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {r.views.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string | string[] };
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
            <p className="muted">This area is restricted.</p>
            <Link href="/" className="btn" style={{ marginTop: 8 }}>Back to home</Link>
          </div>
        </div>
      </>
    );
  }

  const days = parseDays(searchParams.days);
  const [summary, daily, paths, referrers, countries, salesByPack] = await Promise.all([
    getAnalyticsSummary(days),
    getAnalyticsDaily(days),
    getTopPaths(days),
    getTopReferrers(days),
    getTopCountries(days),
    getSalesByPack(days),
  ]);

  const maxViews = Math.max(1, ...daily.map((d) => d.views));
  const convRate =
    summary.visitors > 0 ? (summary.purchases / summary.visitors) * 100 : 0;

  const windows: { d: number; label: string }[] = [
    { d: 7, label: "7d" },
    { d: 30, label: "30d" },
    { d: 90, label: "90d" },
  ];

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1>Analytics</h1>
            <p>Traffic and conversions for the last {days} days.</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {windows.map((w) => (
              <Link
                key={w.d}
                href={`/admin/analytics?days=${w.d}`}
                className="btn"
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  opacity: w.d === days ? 1 : 0.6,
                  fontWeight: w.d === days ? 700 : 500,
                }}
              >
                {w.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Headline numbers */}
        <div className="audit-stats" style={{ marginBottom: 26 }}>
          <div className="audit-stat">
            <span className="audit-num">{summary.views.toLocaleString()}</span>
            <span className="audit-label">Page views</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num verified">{summary.visitors.toLocaleString()}</span>
            <span className="audit-label">Unique visitors</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{summary.purchases.toLocaleString()}</span>
            <span className="audit-label">Purchases</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num verified">{formatUSD(summary.revenue_cents)}</span>
            <span className="audit-label">Revenue</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{convRate.toFixed(1)}%</span>
            <span className="audit-label">Conversion</span>
          </div>
        </div>

        {/* Sales by pack — reconciles with Stripe */}
        <div className="card" style={{ marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Sales by pack</h3>
            <span className="muted" style={{ fontSize: 12 }}>Should match your Stripe payments for the same period.</span>
          </div>
          {summary.purchases === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>No sales yet in this window.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pack</th>
                    <th style={{ textAlign: "right" }}>Sales</th>
                    <th style={{ textAlign: "right" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByPack.map((p) => (
                    <tr key={p.label}>
                      <td>{p.label}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.sales.toLocaleString()}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatUSD(p.revenue_cents)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, borderTop: "2px solid rgba(0,0,0,0.1)" }}>
                    <td>Total</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{summary.purchases.toLocaleString()}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatUSD(summary.revenue_cents)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Views over time */}
        <div className="card" style={{ marginBottom: 26 }}>
          <h3 style={{ marginTop: 0 }}>Views over time</h3>
          {daily.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>No data yet.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 160, marginTop: 12 }}>
              {daily.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.views} views, ${d.visitors} visitors${d.purchases ? `, ${d.purchases} purchase(s)` : ""}`}
                  style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}
                >
                  <div
                    style={{
                      height: `${(d.views / maxViews) * 100}%`,
                      minHeight: d.views > 0 ? 2 : 0,
                      background: d.purchases > 0 ? "rgba(34,197,94,0.65)" : "rgba(99,102,241,0.55)",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <p className="muted" style={{ fontSize: 12, marginBottom: 0, marginTop: 10 }}>
            Bars show daily page views. Green bars are days with at least one purchase.
          </p>
        </div>

        {/* Breakdowns */}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top pages</h3>
            <TallyList rows={paths} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top referrers</h3>
            <TallyList rows={referrers} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top countries</h3>
            <TallyList rows={countries} />
          </div>
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>
          <Link href="/admin">← Back to admin</Link>
        </p>
      </div>
    </>
  );
}
