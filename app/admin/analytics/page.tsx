import Link from "next/link";
import TopBar from "@/components/TopBar";
import { isAdmin } from "@/lib/admin";
import {
  getAnalyticsSummary,
  getAnalyticsDaily,
  getTopPaths,
  getTopReferrers,
  getTopCountries,
  getTopDevices,
  getTopBrowsers,
  getSalesByPack,
  getRecentPurchases,
  getChannels,
  getTopCampaigns,
  type Tally,
  type ChannelRow,
  type CampaignRow,
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

// Attribution table for channels/campaigns: traffic + sales + revenue.
function AttribTable({
  rows,
  firstCol,
}: {
  rows: (ChannelRow | CampaignRow)[];
  firstCol: string;
}) {
  if (rows.length === 0) {
    return <p className="muted" style={{ fontSize: 13, margin: 0 }}>No data yet.</p>;
  }
  const label = (r: ChannelRow | CampaignRow) => ("channel" in r ? r.channel : r.campaign);
  const num = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{firstCol}</th>
            <th style={{ textAlign: "right" }}>Visits</th>
            <th style={{ textAlign: "right" }}>Sales</th>
            <th style={{ textAlign: "right" }}>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={label(r)}>
              <td>{label(r)}</td>
              <td style={num}>{r.views.toLocaleString()}</td>
              <td style={num}>{r.sales.toLocaleString()}</td>
              <td style={num}>{formatUSD(r.revenue_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ margin: "34px 0 14px", borderBottom: "2px solid rgba(99,102,241,0.25)", paddingBottom: 8 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>{subtitle}</p>
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
  const [summary, daily, paths, referrers, countries, devices, browsers, salesByPack, purchases, channels, campaigns] =
    await Promise.all([
      getAnalyticsSummary(days),
      getAnalyticsDaily(days),
      getTopPaths(days),
      getTopReferrers(days),
      getTopCountries(days),
      getTopDevices(days),
      getTopBrowsers(days),
      getSalesByPack(days),
      getRecentPurchases(days),
      getChannels(days),
      getTopCampaigns(days),
    ]);

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const maxViews = Math.max(1, ...daily.map((d) => d.views));
  const maxRev = Math.max(1, ...daily.map((d) => d.revenue_cents));
  const convRate = summary.visitors > 0 ? (summary.purchases / summary.visitors) * 100 : 0;
  const aovCents = summary.purchases > 0 ? Math.round(summary.revenue_cents / summary.purchases) : 0;
  // Net is estimated: gross − refunds − Stripe fees (~2.9% + 30¢ per sale).
  const feeCents = Math.round(summary.revenue_cents * 0.029) + summary.purchases * 30;
  const netCents = Math.max(0, summary.revenue_cents - summary.refunds_cents - feeCents);

  const windows: { d: number; label: string }[] = [
    { d: 7, label: "7d" },
    { d: 30, label: "30d" },
    { d: 90, label: "90d" },
  ];
  const numCell = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1>Analytics</h1>
            <p>Web, marketing, and financial — last {days} days.</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {windows.map((w) => (
              <Link
                key={w.d}
                href={`/admin/analytics?days=${w.d}`}
                className="btn"
                style={{ padding: "6px 12px", fontSize: 13, opacity: w.d === days ? 1 : 0.6, fontWeight: w.d === days ? 700 : 500 }}
              >
                {w.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ===================== FINANCIAL ===================== */}
        <SectionHeading title="💰 Financial" subtitle="Revenue and conversions — reconciles with your Stripe payments." />

        <div className="audit-stats" style={{ marginBottom: 22 }}>
          <div className="audit-stat">
            <span className="audit-num verified">{formatUSD(summary.revenue_cents)}</span>
            <span className="audit-label">Revenue (gross)</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{formatUSD(netCents)}</span>
            <span className="audit-label">Net (est.)</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{formatUSD(aovCents)}</span>
            <span className="audit-label">Avg order</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{summary.purchases.toLocaleString()}</span>
            <span className="audit-label">Purchases</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{summary.refunds.toLocaleString()}{summary.refunds_cents > 0 ? ` · ${formatUSD(summary.refunds_cents)}` : ""}</span>
            <span className="audit-label">Refunds</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num">{convRate.toFixed(1)}%</span>
            <span className="audit-label">Conversion</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <h3 style={{ marginTop: 0 }}>Revenue over time</h3>
          {daily.length === 0 || summary.revenue_cents === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>No revenue yet in this window.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140, marginTop: 12 }}>
              {daily.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${formatUSD(d.revenue_cents)} (${d.purchases} sale${d.purchases === 1 ? "" : "s"})`}
                  style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}
                >
                  <div
                    style={{
                      height: `${(d.revenue_cents / maxRev) * 100}%`,
                      minHeight: d.revenue_cents > 0 ? 2 : 0,
                      background: "rgba(34,197,94,0.6)",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", marginBottom: 4 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Sales by pack</h3>
            {summary.purchases === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>No sales yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Pack</th><th style={{ textAlign: "right" }}>Sales</th><th style={{ textAlign: "right" }}>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {salesByPack.map((p) => (
                      <tr key={p.label}>
                        <td>{p.label}</td>
                        <td style={numCell}>{p.sales.toLocaleString()}</td>
                        <td style={numCell}>{formatUSD(p.revenue_cents)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, borderTop: "2px solid rgba(0,0,0,0.1)" }}>
                      <td>Total</td>
                      <td style={numCell}>{summary.purchases.toLocaleString()}</td>
                      <td style={numCell}>{formatUSD(summary.revenue_cents)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Recent purchases</h3>
            {purchases.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>No purchases yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Customer</th><th>Pack</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "right" }}>When</th></tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={`${p.created_at}-${i}`}>
                        <td>{p.email ?? "—"}</td>
                        <td>{p.label}</td>
                        <td style={numCell}>{p.amount_cents === null ? "—" : formatUSD(p.amount_cents)}</td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{fmtDateTime(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ===================== MARKETING ===================== */}
        <SectionHeading title="📣 Marketing" subtitle="Where traffic comes from and which sources drive revenue." />

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>Channels</h3>
            <span className="muted" style={{ fontSize: 12 }}>Sales attributed last-touch from the buyer&apos;s visit.</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <AttribTable rows={channels} firstCol="Channel" />
          </div>
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Campaigns (UTM)</h3>
            <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
              Tag links with <code>?utm_source=&amp;utm_medium=&amp;utm_campaign=</code> to track them here.
            </p>
            <AttribTable rows={campaigns} firstCol="Campaign" />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top referrers</h3>
            <TallyList rows={referrers} />
          </div>
        </div>

        {/* ===================== WEB ===================== */}
        <SectionHeading title="🌐 Web" subtitle="Traffic, audience, and engagement." />

        <div className="audit-stats" style={{ marginBottom: 22 }}>
          <div className="audit-stat">
            <span className="audit-num">{summary.views.toLocaleString()}</span>
            <span className="audit-label">Page views</span>
          </div>
          <div className="audit-stat">
            <span className="audit-num verified">{summary.visitors.toLocaleString()}</span>
            <span className="audit-label">Unique visitors</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <h3 style={{ marginTop: 0 }}>Views over time</h3>
          {daily.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>No data yet.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140, marginTop: 12 }}>
              {daily.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.views} views, ${d.visitors} visitors`}
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
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top pages</h3>
            <TallyList rows={paths} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Countries</h3>
            <TallyList rows={countries} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Devices</h3>
            <TallyList rows={devices} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Browsers</h3>
            <TallyList rows={browsers} />
          </div>
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>
          <Link href="/admin">← Back to admin</Link>
        </p>
      </div>
    </>
  );
}
