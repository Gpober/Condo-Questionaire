import type { MetadataRoute } from "next";
import { listPublicCondoSummaries } from "@/lib/publicCondos";

// Base site URL for absolute sitemap/robots links. Set NEXT_PUBLIC_SITE_URL in
// production; falls back to the public hostname.
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoadaddy.com").replace(/\/+$/, "");
}

// Google caps a single sitemap at 50k URLs; stay well under.
const MAX_CONDOS = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/condo`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/next-steps`, changeFrequency: "monthly", priority: 0.7 },
  ];

  let condoRoutes: MetadataRoute.Sitemap = [];
  try {
    const condos = await listPublicCondoSummaries(MAX_CONDOS);
    condoRoutes = condos.map((c) => ({
      url: `${base}/condo/${c.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("sitemap condo enumeration failed:", e);
  }

  return [...staticRoutes, ...condoRoutes];
}
