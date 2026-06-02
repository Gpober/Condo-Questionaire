// Interprets the free-text `condo_review` value into a color/label. Adjust the
// keyword lists once we know the exact vocabulary used in your data.
export type ReviewTone = "ok" | "bad" | "neutral";

export function reviewTone(review: string | null): ReviewTone {
  if (!review) return "neutral";
  const v = review.toLowerCase();
  if (/(ineligible|denied|non[\s-]?warrantable|reject|fail)/.test(v)) return "bad";
  if (/(eligible|approved|warrantable|pass|accept)/.test(v)) return "ok";
  return "neutral";
}

// Expiration helpers — the core of "can I reuse this questionnaire?".
export function isExpired(date: string | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function expiryLabel(date: string | null): string {
  if (!date) return "—";
  const d = daysUntil(date);
  if (d === null) return "—";
  if (d < 0) return `Expired (${date})`;
  if (d <= 30) return `Expires soon · ${date} (${d}d)`;
  return date;
}
