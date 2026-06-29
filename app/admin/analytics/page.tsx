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

function parseDays(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return [7, 30, 90].includes(n) ? n : 30;
}

// Clickable list of label → count; each row drills into the detail view.
function TallyList({ rows, metric, days }: { rows: Tally[]; metric: string; days: number }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  if (rows.length === 0) {
    return <p className="muted" style={{ fontSize: 13, margin: 0, textAlign: "center" }}>No data yet.</p>;
  }
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map((r) => (
        <Link
          key={r.label}
          href={`/admin/analytics/detail?metric=${metric}&value=${encodeURIComponent(r.label)}&days=${days}`}
          style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ position: "relative", minWidth: 0 }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, width: `${(r.views / max) * 100}%`, background: "rgba(99,102,241,0.15)", borderRadius: 6 }} />
            <span style={{ position: "relative", padding: "4px 8px", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} title={r.label}>
              {r.label}
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.views.toLocaleString()}</span>
        </Link>
      ))}
    </div>
  );
}

// Attribution table for channels/campaigns; each row drills into detail.
function AttribTable({
  rows,
  firstCol,
  metric,
  days,
}: {
  rows: (ChannelRow | CampaignRow)[];
  firstCol: string;
  metric: string;
  days: number;
}) {
  if (rows.length === 0) {
    return <p className="muted" style={{ fontSize: 13, margin: 0, textAlign: "center" }}>No data yet.</p>;
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
              <td>
                <Link href={`/admin/analytics/detail?metric=${metric}&value=${encodeURIComponent(label(r))}&days=${days}`}>
                  {label(r)}
                </Link>
              </td>
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
    <div style={{ margin: "34px 0 14px", borderBottom: "2px solid rgba(99,102,241,0.25)", paddingBottom: 8, textAlign: "center" }}>
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
  const feeCents = Math.round(summary.revenue_cents * 0.029) + summary.purchases * 30;
  const netCents = Math.max(0, summary.revenue_cents - summary.refunds_cents - feeCents);

  const windows = [
    { d: 7, label: "7d" },
    { d: 30, label: "30d" },
    { d: 90, label: "90d" },
  ];
  const numCell = { textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };
  const href = (metric: string, value?: string) =>
    `/admin/analytics/detail?metric=${metric}${value !== undefined ? `&value=${encodeURIComponent(value)}` : ""}&days=${days}`;

  // Clickable KPI card.
  function Kpi({ metric, value, label, accent }: { metric: string; value: string; label: string; accent?: boolean }) {
    return (
      <Link href={href(metric)} className="audit-stat">
        <span className={`audit-num${accent ? " verified" : ""}`}>{value}</span>
        <span className="audit-label">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="page-head">
          <h1>Analytics</h1>
          <p>Web, marketing, and financial — last {days} days. Tap any number to see the detail.</p>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12 }}>
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
          <Kpi metric="revenue" value={formatUSD(summary.revenue_cents)} label="Revenue (gross)" accent />
          <Kpi metric="revenue" value={formatUSD(netCents)} label="Net (est.)" />
          <Kpi metric="purchases" value={formatUSD(aovCents)} label="Avg order" />
          <Kpi metric="purchases" value={summary.purchases.toLocaleString()} label="Purchases" />
          <Kpi
            metric="refunds"
            value={`${summary.refunds.toLocaleString()}${summary.refunds_cents > 0 ? ` · ${formatUSD(summary.refunds_cents)}` : ""}`}
            label="Refunds"
          />
          <Kpi metric="conversion" value={`${convRate.toFixed(1)}%`} label="Conversion" />
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
                  <div style={{ height: `${(d.revenue_cents / maxRev) * 100}%`, minHeight: d.revenue_cents > 0 ? 2 : 0, background: "rgba(34,197,94,0.6)", borderRadius: "4px 4px 0 0" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
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
                        <td><Link href={href("pack", p.label)}>{p.label}</Link></td>
                        <td style={numCell}>{p.sales.toLocaleString()}</td>
                        <td style={numCell}>{formatUSD(p.revenue_cents)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, borderTop: "2px solid rgba(0,0,0,0.1)" }}>
                      <td><Link href={href("purchases")}>Total</Link></td>
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
            <span className="muted" style={{ fontSize: 12 }}>Tap a channel for the underlying visits &amp; sales.</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <AttribTable rows={channels} firstCol="Channel" metric="channel" days={days} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Campaigns (UTM)</h3>
            <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
              Tag links with <code>?utm_source=&amp;utm_medium=&amp;utm_campaign=</code> to track them here.
            </p>
            <AttribTable rows={campaigns} firstCol="Campaign" metric="campaign" days={days} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top referrers</h3>
            <TallyList rows={referrers} metric="referrer" days={days} />
          </div>
        </div>

        {/* ===================== WEB ===================== */}
        <SectionHeading title="🌐 Web" subtitle="Traffic, audience, and engagement." />

        <div className="audit-stats" style={{ marginBottom: 22 }}>
          <Kpi metric="views" value={summary.views.toLocaleString()} label="Page views" />
          <Kpi metric="visitors" value={summary.visitors.toLocaleString()} label="Unique visitors" accent />
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
                  <div style={{ height: `${(d.views / maxViews) * 100}%`, minHeight: d.views > 0 ? 2 : 0, background: d.purchases > 0 ? "rgba(34,197,94,0.65)" : "rgba(99,102,241,0.55)", borderRadius: "4px 4px 0 0" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Top pages</h3>
            <TallyList rows={paths} metric="path" days={days} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Countries</h3>
            <TallyList rows={countries} metric="country" days={days} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Devices</h3>
            <TallyList rows={devices} metric="device" days={days} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Browsers</h3>
            <TallyList rows={browsers} metric="browser" days={days} />
          </div>
        </div>

        <p className="muted" style={{ fontSize: 13, marginTop: 24, textAlign: "center" }}>
          <Link href="/admin">← Back to admin</Link>
        </p>
      </div>
    </>
  );
}
