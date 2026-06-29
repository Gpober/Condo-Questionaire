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

    const params = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || "",
      sessionId: getSessionId(),
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
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
