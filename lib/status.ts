import { WarrantabilityStatus } from "./types";

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

// Map review text (+ blacklist flag) to the coarse public status bucket.
export function publicStatus(
  review: string | null,
  blacklisted: boolean
): WarrantabilityStatus {
  if (blacklisted) return "blacklisted";
  const tone = reviewTone(review);
  if (tone === "ok") return "warrantable";
  if (tone === "bad") return "non_warrantable";
  return "unknown";
}

// Human label + badge class (reuses the existing .badge.* styles) for a status.
export function statusLabel(s: WarrantabilityStatus): string {
  switch (s) {
    case "warrantable":
      return "Warrantable";
    case "non_warrantable":
      return "Non-warrantable";
    case "blacklisted":
      return "Blacklisted";
    default:
      return "Status under review";
  }
}

export function statusBadgeClass(s: WarrantabilityStatus): string {
  switch (s) {
    case "warrantable":
      return "warrantable";
    case "non_warrantable":
      return "non_warrantable";
    case "blacklisted":
      return "blacklist";
    default:
      return "unknown";
  }
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
