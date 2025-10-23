import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Generate sitemap.xml using Next.js Metadata Route
// Includes static pages and dynamic event pages for better SEO
// Uses proper lastModified dates for cache optimization
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env['NEXT_PUBLIC_SITE_URL']?.trim().replace(/\/$/, "")) || "http://localhost:3000";
  const now = new Date();

  // Static pages with SEO-optimized priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/apply`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Fetch public events for dynamic sitemap entries
  // This improves SEO by ensuring all event pages are discoverable
  try {
    const events = await prisma.event.findMany({
      where: {
        status: "Published",
      },
      select: {
        id: true,
        updatedAt: true,
        startAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 1000, // Limit to prevent excessive sitemap size
    });

    const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${siteUrl}/events/${event.id}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...eventPages];
  } catch (error) {
    // Fallback to static pages only if database query fails
    console.error("Error fetching events for sitemap:", error);
    return staticPages;
  }
}

// Enable revalidation for performance optimization
// Sitemap will be cached and regenerated every hour
export const revalidate = 3600; // 1 hour in seconds
