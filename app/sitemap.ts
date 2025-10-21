import type { MetadataRoute } from "next";

// Generate sitemap.xml using Next.js Metadata Route
// Minimal, safe implementation with core static pages. Extend as needed.
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")) || "http://localhost:3000";
  const now = new Date();

  const pages = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/events", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/apply", changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  return pages.map((p) => ({
    url: `${siteUrl}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
