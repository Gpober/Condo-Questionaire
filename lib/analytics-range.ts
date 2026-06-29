// Resolve analytics date-range query params (?range=30d or ?from=&to=) into
// concrete from/to timestamps + a chart bucket. Server-safe (no client APIs).

export type Bucket = "day" | "week" | "month";

export interface ResolvedRange {
  fromISO: string;
  toISO: string;
  bucket: Bucket;
  label: string;
  preset: string; // a preset key or "custom"
  from: string; // YYYY-MM-DD, for the custom inputs
  to: string; // YYYY-MM-DD (inclusive)
}

export const RANGE_PRESETS: { key: string; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "6m", label: "6m" },
  { key: "12m", label: "12m" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "All" },
];

const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) || "";
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const subMonths = (d: Date, n: number) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, d.getUTCDate()));

function bucketFor(days: number): Bucket {
  if (days <= 92) return "day";
  if (days <= 400) return "week";
  return "month";
}

export function resolveRange(sp: {
  range?: string | string[];
  from?: string | string[];
  to?: string | string[];
}): ResolvedRange {
  const now = new Date();
  const cFrom = pick(sp.from);
  const cTo = pick(sp.to);

  // Custom from/to (inclusive end → exclusive next-day boundary).
  if (cFrom && cTo) {
    const from = new Date(cFrom + "T00:00:00.000Z");
    const toExcl = addDays(new Date(cTo + "T00:00:00.000Z"), 1);
    const days = Math.max(1, Math.round((toExcl.getTime() - from.getTime()) / 86400000));
    return {
      fromISO: from.toISOString(),
      toISO: toExcl.toISOString(),
      bucket: bucketFor(days),
      label: `${cFrom} → ${cTo}`,
      preset: "custom",
      from: cFrom,
      to: cTo,
    };
  }

  let preset = pick(sp.range) || "30d";
  let from: Date;
  let label: string;
  switch (preset) {
    case "7d": from = addDays(now, -7); label = "Last 7 days"; break;
    case "90d": from = addDays(now, -90); label = "Last 90 days"; break;
    case "6m": from = subMonths(now, 6); label = "Last 6 months"; break;
    case "12m": from = subMonths(now, 12); label = "Last 12 months"; break;
    case "ytd": from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)); label = "Year to date"; break;
    case "all": from = new Date(Date.UTC(2020, 0, 1)); label = "All time"; break;
    default: preset = "30d"; from = addDays(now, -30); label = "Last 30 days"; break;
  }
  const days = Math.max(1, Math.round((now.getTime() - from.getTime()) / 86400000));
  return {
    fromISO: from.toISOString(),
    toISO: now.toISOString(),
    bucket: bucketFor(days),
    label,
    preset,
    from: ymd(from),
    to: ymd(now),
  };
}

// Build the query string that carries the active range (for drill-down links).
export function rangeQuery(r: ResolvedRange): string {
  return r.preset === "custom"
    ? `from=${r.from}&to=${r.to}`
    : `range=${r.preset}`;
}
