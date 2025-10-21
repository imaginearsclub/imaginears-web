import type { MetadataRoute } from "next";

// Generate robots.txt using Next.js Metadata Route
// - In production: allow crawling of the entire site
// - In non-production: disallow all to avoid accidental indexing of previews
// - Host and sitemap are derived from NEXT_PUBLIC_SITE_URL if provided
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")) || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: isProd ? "/" : [],
        disallow: isProd ? undefined : "/",
        crawlDelay: 5,
      },
    ],
    host: siteUrl,
    sitemap: [`${siteUrl}/sitemap.xml`],
  };
}
