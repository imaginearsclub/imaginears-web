import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import EventsPublicFilter from "@/components/public/EventsPublicFilter";
import { Skeleton, Breadcrumb } from "@/components/common";
import { Calendar } from "lucide-react";

// ISR configuration for optimal performance
export const revalidate = 300; // 5 minutes cache
export const dynamic = "force-static"; // Prefer static generation
export const fetchCache = "default-cache";

// Security: Limit results to prevent DOS
const MAX_EVENTS = 500;

// Metadata for SEO
export const metadata = {
    title: "Events | Imaginears Resort",
    description: "Browse upcoming events, shows, and experiences at Imaginears Resort. Find fireworks, parades, seasonal overlays, and more.",
};

// Performance: Type-safe event selection
type PublicEventData = {
    id: string;
    title: string;
    world: string;
    startAt: Date;
    endAt: Date;
    status: string;
    category: string;
    shortDescription: string | null;
};

/**
 * Fetch events with security and performance optimizations
 */
async function getPublicEvents(): Promise<PublicEventData[]> {
    try {
        const events = await prisma.event.findMany({
            // Security: Only show approved events
            where: { 
                status: { in: ["Scheduled", "Published"] },
                // Only show future or current events
                endAt: { gte: new Date() }
            },
            // Performance: Limit results
            take: MAX_EVENTS,
            // Order by start time for better UX
            orderBy: [{ startAt: "asc" }, { title: "asc" }],
            // Performance: Only select needed fields
            select: {
                id: true,
                title: true,
                world: true,
                startAt: true,
                endAt: true,
                status: true,
                category: true,
                shortDescription: true,
            },
        });

        // Security: Validate and sanitize data before returning
        return events.filter(event => {
            // Ensure all required fields exist
            return (
                event.id &&
                event.title &&
                event.world &&
                event.startAt &&
                event.endAt &&
                event.status &&
                event.category
            );
        });
    } catch (error) {
        // Log error for monitoring but don't expose details to client
        console.error("[Events] Database error:", error);
        
        // Fail gracefully with empty array
        return [];
    }
}

/**
 * Loading skeleton for events page
 */
function EventsPageSkeleton() {
    return (
        <section className="band">
            <div className="container py-10">
                <Skeleton className="h-9 w-32 mb-4" />
                <Skeleton className="h-6 w-96 mb-6" />
                
                <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    {/* Filter Controls Skeleton */}
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <Skeleton className="h-11 flex-1" />
                        <div className="flex gap-3">
                            <Skeleton className="h-11 w-40" />
                            <Skeleton className="h-11 w-40" />
                        </div>
                    </div>
                    
                    <Skeleton className="h-5 w-48 mt-4" />
                    
                    {/* Event Grid Skeleton */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div 
                                key={i} 
                                className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                    <Skeleton className="h-6 w-32 rounded-full" />
                                </div>
                                <Skeleton className="h-7 w-full mb-2" />
                                <Skeleton className="h-7 w-3/4 mb-2" />
                                <div className="space-y-2 mt-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-4/6" />
                                </div>
                                <Skeleton className="h-4 w-40 mt-3" />
                                <Skeleton className="h-5 w-28 mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Events listing page with ISR and security features
 */
export default async function EventsListingPage() {
    const events = await getPublicEvents();

    return (
        <section className="band">
            <div className="container py-10">
                {/* Breadcrumb Navigation */}
                <Breadcrumb
                    items={[
                        { label: "Events" },
                    ]}
                />

                {/* Page Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Events
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {events.length} upcoming {events.length === 1 ? 'event' : 'events'}
                        </p>
                    </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 mb-6">
                    Browse upcoming happenings across the resort. Filter by category or world to find events that interest you.
                </p>

                <Suspense fallback={<EventsPageSkeleton />}>
                    <EventsPublicFilter events={events as any} />
                </Suspense>
            </div>
        </section>
    );
}
