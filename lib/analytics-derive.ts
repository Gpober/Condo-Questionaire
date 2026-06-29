// Shared, dependency-free helpers to classify traffic for analytics.
// Used by the /api/track route (pageviews) and the Stripe webhook (attribution).

function hostOf(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

// Map a pageview to a marketing channel (last-non-direct style, single touch).
export function deriveChannel(
  utmMedium: string | null | undefined,
  _utmSource: string | null | undefined,
  referrer: string | null | undefined
): string {
  const m = (utmMedium ?? "").toLowerCase().trim();
  if (m) {
    if (["cpc", "ppc", "paid", "paidsearch", "paid-search", "ads", "sem"].includes(m)) return "Paid Search";
    if (["paid-social", "paidsocial", "social-paid"].includes(m)) return "Paid Social";
    if (m === "social") return "Social";
    if (["email", "newsletter", "e-mail"].includes(m)) return "Email";
    if (m === "affiliate") return "Affiliate";
    if (m === "referral") return "Referral";
    if (m === "organic") return "Organic Search";
    return m.charAt(0).toUpperCase() + m.slice(1);
  }

  const ref = hostOf(referrer);
  if (!ref) return "Direct";
  if (/(^|\.)(google|bing|yahoo|duckduckgo|ecosia|baidu|yandex)\./.test(ref + ".")) return "Organic Search";
  if (/(facebook|fb\.me|instagram|twitter|x\.com|t\.co|linkedin|lnkd\.in|youtube|reddit|pinterest|tiktok)/.test(ref))
    return "Social";
  return "Referral";
}

// Coarse device class from a User-Agent string.
export function deviceFromUA(ua: string | null | undefined): string {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "(unknown)";
  if (/ipad|tablet|playbook|silk/.test(s) || (/android/.test(s) && !/mobile/.test(s))) return "Tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(s)) return "Mobile";
  return "Desktop";
}

// Coarse browser family from a User-Agent string.
export function browserFromUA(ua: string | null | undefined): string {
  const s = (ua ?? "").toLowerCase();
  if (!s) return "(unknown)";
  if (/edg\//.test(s)) return "Edge";
  if (/opr\/|opera/.test(s)) return "Opera";
  if (/(chrome|crios)\//.test(s) && !/edg\//.test(s)) return "Chrome";
  if (/(firefox|fxios)\//.test(s)) return "Firefox";
  if (/safari/.test(s) && !/(chrome|crios|android)/.test(s)) return "Safari";
  return "Other";
}
