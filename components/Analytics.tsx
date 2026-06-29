"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Cookieless pageview tracking. Fires one beacon per route change with an
// anonymous per-session id kept in sessionStorage (cleared when the tab closes,
// so no persistent identifier and no cookie banner required).
function getSessionId(): string {
  try {
    const key = "hd_sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // First-touch UTM: capture the campaign from the landing URL and keep
    // sending it for the whole session, so a sale that happens a few clicks
    // later still attributes back to Instagram/TikTok/etc.
    let utm = { utmSource: "", utmMedium: "", utmCampaign: "" };
    try {
      const stored = sessionStorage.getItem("hd_utm");
      if (stored) {
        utm = JSON.parse(stored);
      } else {
        const p = new URLSearchParams(window.location.search);
        utm = {
          utmSource: p.get("utm_source") || "",
          utmMedium: p.get("utm_medium") || "",
          utmCampaign: p.get("utm_campaign") || "",
        };
        if (utm.utmSource || utm.utmMedium || utm.utmCampaign) {
          sessionStorage.setItem("hd_utm", JSON.stringify(utm));
        }
      }
    } catch {
      /* ignore */
    }

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || "",
      sessionId: getSessionId(),
      ...utm,
    });

    // Prefer sendBeacon so it survives navigation; fall back to fetch.
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
      /* fall through to fetch */
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
