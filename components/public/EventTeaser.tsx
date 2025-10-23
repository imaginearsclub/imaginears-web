// components/public/EventTeaser.tsx
import Link from "next/link";
import ScheduleSummary, { type Weekday as SummaryWeekday, type RecurrenceFreq as SummaryRecurrenceFreq } from "@/components/events/ScheduleSummary";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Props = {
    title?: string;
    limit?: number;
};

// Security: Safely coerce limit to a sane integer range to prevent DOS attacks
function clampLimit(v: unknown, min = 1, max = 24, fallback = 6): number {
    const n = typeof v === "number" ? v : Number(v);
    const safe = Number.isFinite(n) ? Math.floor(n) : fallback;
    return Math.min(max, Math.max(min, safe));
}

// Visual: Category color coding for better UX
function getCategoryStyles(category: string | null): string {
    const defaultStyle = "bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    const categoryMap: Record<string, string> = {
        Fireworks: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        SeasonalOverlay: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
        MeetAndGreet: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
        Parade: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
        Other: defaultStyle,
    };
    const key = category || "Other";
    return categoryMap[key] ?? defaultStyle;
}

// Visual: Format category name for display
function formatCategoryName(category: string | null): string {
    const formatMap: Record<string, string> = {
        SeasonalOverlay: "Seasonal",
        MeetAndGreet: "Meet & Greet",
    };
    return formatMap[category || ""] || category || "Other";
}

// Security: Robustly coerce an unknown value into string[] with validation
function asStringArray(v: unknown): string[] {
    try {
        const val = typeof v === "string" ? JSON.parse(v) : v;
        if (!Array.isArray(val)) return [];
        // Security: Limit array size and string length to prevent DOS
        return val
            .slice(0, 50)
            .filter((x) => typeof x === "string" && x.length <= 100);
    } catch {
        return [];
    }
}

// Security: Validate and deduplicate weekday array
function asWeekdayArray(v: unknown): SummaryWeekday[] {
    const s = asStringArray(v);
    const allow = new Set<SummaryWeekday>(["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as SummaryWeekday[]);
    // De-dupe, filter invalid, keep stable order of first occurrence
    const seen = new Set<string>();
    const out: SummaryWeekday[] = [];
    for (const x of s) {
        if (!seen.has(x) && allow.has(x as SummaryWeekday)) {
            seen.add(x);
            out.push(x as SummaryWeekday);
        }
    }
    return out;
}

// Security: Validate timezone to prevent injection attacks
function isValidTimeZone(tz: string): boolean {
    if (!tz || typeof tz !== "string" || tz.length > 100) return false;
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
        return true;
    } catch {
        return false;
    }
}

// Performance: Cache upcoming events to reduce DB load and improve TTFB
// Security: Returns empty array on error to prevent data leakage
const getUpcomingEvents = unstable_cache(
    async (take: number) => {
        try {
            const events = await prisma.event.findMany({
                where: { 
                    status: {
                        in: ["Scheduled", "Published"],
                    },
                },
                orderBy: [
                    { startAt: "asc" }, // Show earliest events first
                    { recurrenceFreq: "desc" }, 
                ],
                take,
                select: {
                    id: true,
                    title: true,
                    world: true,
                    category: true,
                    shortDescription: true,
                    timezone: true,
                    recurrenceFreq: true,
                    byWeekdayJson: true,
                    timesJson: true,
                    recurrenceUntil: true,
                    startAt: true,
                },
            });
            return events;
        } catch (err) {
            // Security: Log error server-side but don't expose details to client
            console.error("EventTeaser: Database query failed", err instanceof Error ? err.message : String(err));
            return [];
        }
    },
    ["event-teaser"],
    { 
        revalidate: 300, // 5 minutes
        tags: ["events"] 
    }
);

export default async function EventTeaser({ title = "Events", limit = 6 }: Props) {
    // Security: Validate and clamp limit parameter
    const take = clampLimit(limit);
    const events = await getUpcomingEvents(take);

    return (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-10" aria-labelledby="events-heading">
            {/* Header with improved visual hierarchy and readability */}
            <div className="flex items-center justify-between mb-6">
                <h2 id="events-heading" className="text-3xl font-extrabold tracking-tight text-body dark:text-white">
                    {title}
                </h2>
                <Link 
                    href="/events" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    aria-label="View all events"
                >
                    View all 
                    <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
                </Link>
            </div>

            {/* Event grid with improved cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((e) => {
                    // Security: Validate all user-generated content
                    const tzRaw = e.timezone || "America/New_York";
                    const tz = isValidTimeZone(tzRaw) ? tzRaw : "America/New_York";
                    const byWeekday = asWeekdayArray(e.byWeekdayJson);
                    const times = asStringArray(e.timesJson);
                    const recurrenceFreq = (e.recurrenceFreq as unknown) as SummaryRecurrenceFreq;
                    const categoryStyles = getCategoryStyles(e.category);
                    const categoryName = formatCategoryName(e.category);

                    return (
                        <article
                            key={e.id}
                            className="group relative rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-md hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-1.5"
                        >
                            {/* Category badge with color coding */}
                            <header className="flex items-start justify-between gap-3 mb-4">
                                <h3 className="text-lg font-bold leading-snug flex-1 min-w-0 text-gray-900 dark:text-white">
                                    <Link 
                                        href={`/events/${e.id}`} 
                                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                                        aria-label={`View details for ${e.title}`}
                                    >
                                        {e.title}
                                    </Link>
                                </h3>
                                <span 
                                    className={`text-xs font-semibold rounded-full border px-3 py-1.5 shrink-0 ${categoryStyles}`}
                                    aria-label={`Event category: ${categoryName}`}
                                >
                                    {categoryName}
                                </span>
                            </header>

                            {/* Schedule information with improved spacing */}
                            <div className="mb-4">
                                <ScheduleSummary
                                    recurrenceFreq={recurrenceFreq}
                                    byWeekday={byWeekday}
                                    times={times}
                                    timezone={tz}
                                    until={e.recurrenceUntil ?? null}
                                    className="text-sm text-gray-700 dark:text-gray-300"
                                />
                            </div>

                            {/* Description with improved typography */}
                            {e.shortDescription && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">
                                    {e.shortDescription}
                                </p>
                            )}

                            {/* Call-to-action with improved hover state */}
                            <footer className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
                                <Link
                                    href={`/events/${e.id}`}
                                    className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    aria-label={`View full details for ${e.title}`}
                                >
                                    View details
                                    <span className="group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
                                </Link>
                            </footer>

                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/[0.03] group-hover:to-indigo-500/[0.03] transition-all duration-300 pointer-events-none" aria-hidden="true" />
                        </article>
                    );
                })}

                {/* Improved empty state */}
                {!events.length && (
                    <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-12 text-center">
                        <div className="mx-auto max-w-sm">
                            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-700 dark:text-slate-300 font-semibold mb-2">No events scheduled</p>
                            <p className="text-sm text-gray-600 dark:text-slate-400">Check back soon for upcoming magical experiences!</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
