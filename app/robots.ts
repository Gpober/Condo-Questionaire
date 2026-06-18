import type { MetadataRoute } from "next";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hoadaddy.com").replace(/\/+$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/paid/auth surfaces out of the index.
      disallow: ["/account", "/admin", "/login", "/project/", "/api/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
