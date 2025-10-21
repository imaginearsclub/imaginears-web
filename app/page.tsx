import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import Highlights from "@/components/home/Highlights";
import SocialProof from "@/components/home/SocialProof";
import ServerCTA from "@/components/home/ServerCTA";
import Newsletter from "@/components/home/Newsletter";
import FAQ from "@/components/home/FAQ";
import EventTeaser from "@/components/public/EventTeaser";

// Force Node.js runtime to ensure compatibility with server-only modules (e.g., Prisma) used by children.
export const runtime = "nodejs";
// Revalidate the page shell every 60s for a balance of freshness and performance.
export const revalidate = 60;

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Highlights />
      <SocialProof />
      <Suspense
        fallback={
          <section aria-busy="true" aria-live="polite" className="container py-12">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Happening Now</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0,1,2].map((i) => (
                <div key={i} className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-4">
                  <div className="h-40 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-4 h-4 w-3/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </section>
        }
      >
        <EventTeaser title="Happening Now" limit={3} />
      </Suspense>
      <ServerCTA />
      <Newsletter />
      <FAQ />
    </main>
  );
}
