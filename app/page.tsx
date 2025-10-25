import { Suspense } from "react";
import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Highlights from "@/components/home/Highlights";
import SocialProof from "@/components/home/SocialProof";
import ServerCTA from "@/components/home/ServerCTA";
import Newsletter from "@/components/home/Newsletter";
import FAQ from "@/components/home/FAQ";
import EventTeaser from "@/components/public/EventTeaser";
import ServerStatus from "@/components/home/ServerStatus";
import { Skeleton } from "@/components/common";

// Force Node.js runtime to ensure compatibility with server-only modules (e.g., Prisma) used by children.
export const runtime = "nodejs";

// Performance: Revalidate every 5 minutes for fresh content while reducing DB load
export const revalidate = 300;

// Security & SEO: Enhanced metadata for homepage
export const metadata: Metadata = {
  title: "Imaginears Club - A Magical Disney-Inspired Minecraft Experience",
  description: "Join Imaginears Club, a family-friendly Disney-inspired Minecraft server with custom rides, shows, and seasonal events. Experience the magic with our welcoming community!",
  keywords: ["Minecraft server", "Disney Minecraft", "Imaginears", "Theme park server", "Family-friendly Minecraft", "Minecraft events", "Custom Minecraft builds"],
  openGraph: {
    title: "Imaginears Club - A Magical Disney-Inspired Minecraft Experience",
    description: "Join our magical Disney-inspired Minecraft world with custom rides, shows, and seasonal events crafted by fans for fans.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imaginears Club - A Magical Disney-Inspired Minecraft Experience",
    description: "Join our magical Disney-inspired Minecraft world with custom rides, shows, and seasonal events.",
  },
  alternates: {
    canonical: "/",
  },
  // Security: Prevent referrer leakage to external sites
  referrer: "strict-origin-when-cross-origin",
  // Security: Prevent clickjacking
  other: {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
  },
};

// Performance: EventTeaser loading skeleton component (matches actual content structure)
function EventTeaserSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-10" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Happening Now</h2>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <article
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
            aria-hidden="true"
          >
            {/* Header skeleton */}
            <header className="flex items-start justify-between gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </header>
            {/* Schedule skeleton */}
            <div className="mt-2 space-y-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            {/* Description skeleton */}
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
            {/* Footer skeleton */}
            <footer className="mt-4">
              <Skeleton className="h-4 w-24" />
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main id="main" className="scroll-smooth">
      {/* Above the fold - Critical content with priority loading */}
      <Hero />
      
      {/* Progressive enhancement - Load features in order of importance */}
      <Highlights />
      
      {/* Server Status Widget */}
      <section className="band">
        <div className="container py-8">
          <ServerStatus />
        </div>
      </section>
      
      <SocialProof />
      
      {/* Performance: Suspense boundary for dynamic content to prevent blocking */}
      <Suspense fallback={<EventTeaserSkeleton />}>
        <EventTeaser title="Happening Now" limit={3} />
      </Suspense>
      
      {/* Below the fold - Lower priority sections */}
      <ServerCTA />
      <Newsletter />
      <FAQ />
    </main>
  );
}
