import type { MetadataRoute } from "next";

// Generate robots.txt using Next.js Metadata Route
// Security: Blocks admin, API, and sensitive paths
// Performance: Prevents crawling of resource-intensive endpoints
// SEO: Allows good bots, restricts aggressive crawlers
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === "production";
  const siteUrl = (process.env['NEXT_PUBLIC_SITE_URL']?.trim().replace(/\/$/, "")) || "http://localhost:3000";

  // In non-production, block everything to prevent accidental indexing
  if (!isProd) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  // Production rules: secure and SEO-optimized
  return {
    rules: [
      // Good search engine bots - full access except protected routes
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider"],
        allow: "/",
        disallow: [
          "/admin/*",
          "/api/*",
          "/login",
          "/register",
          "/apply/success",
          "/*?*", // Block query parameters to reduce duplicate content
        ],
      },
      // All other bots - more restrictive with crawl delay
      {
        userAgent: "*",
        allow: ["/", "/events", "/events/*"],
        disallow: [
          "/admin/*",
          "/api/*",
          "/login",
          "/register",
          "/apply/success",
          "/*?*",
        ],
        crawlDelay: 10, // Slower crawl for unknown bots
      },
      // Block aggressive/malicious bots
      {
        userAgent: [
          "GPTBot", // OpenAI crawler
          "ChatGPT-User", // ChatGPT
          "CCBot", // Common Crawl
          "anthropic-ai", // Claude
          "Claude-Web", // Claude web crawler
          "cohere-ai", // Cohere AI
          "Omgilibot", // Omgili
          "FacebookBot", // Facebook crawler
          "Bytespider", // ByteDance/TikTok
          "ImagesiftBot", // Image scraper
        ],
        disallow: "/",
      },
    ],
    host: siteUrl,
    sitemap: [`${siteUrl}/sitemap.xml`],
  };
}
