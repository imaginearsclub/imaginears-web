import { notFound } from "next/navigation";
import { EventStatus, type Weekday } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expandEventOccurrences } from "@/lib/recurrence";
import { addDays, format as fmt } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeRehypePlugins } from "@/lib/markdown";
import { Badge, EmptyState, Separator } from "@/components/common";
import { cn } from "@/lib/utils";
import { Calendar, Clock, MapPin } from "lucide-react";
import ScheduleSummary from "@/components/events/ScheduleSummary";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";
import ShareButton from "@/components/events/ShareButton";
import CountdownBadge from "@/components/events/CountdownBadge";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-static"; // Static generation for public events
export const revalidate = 600; // ISR: Revalidate every 10 minutes

// Security: Constants for validation
const MAX_ID_LENGTH = 50;
const MAX_UPCOMING_ITEMS = 12;
const UPCOMING_DAYS_WINDOW = 21;
const MAX_OCCURRENCES_TO_EXPAND = 300;

// Security: Validate event ID format
function isValidEventId(id: string): boolean {
    // Must be alphanumeric with limited special chars (CUID format)
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= MAX_ID_LENGTH;
}

// Security: Sanitize timezone
function sanitizeTimezone(tz: string | null): string {
    const DEFAULT_TZ = "America/New_York";
    if (!tz) return DEFAULT_TZ;
    
    // Basic validation - only allow standard timezone format
    if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(tz)) {
        return DEFAULT_TZ;
    }
    
    return tz;
}

function asStringArray(v: unknown): string[] {
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function asWeekdayArray(v: unknown): Weekday[] {
    const s = asStringArray(v);
    const allow = new Set<Weekday>(["SU","MO","TU","WE","TH","FR","SA"] as Weekday[]);
    return s.filter((x): x is Weekday => allow.has(x as Weekday));
}

function formatLocalTime(utc: Date, tz: string) {
    const local = toZonedTime(utc, tz);
    return fmt(local, "EEE, MMM d • h:mm a");
}

/**
 * Generate metadata for SEO
 * Security: Sanitizes event data before using in metadata
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    // Security: Validate ID
    if (!isValidEventId(id)) {
        return {
            title: "Event Not Found",
            description: "The requested event could not be found.",
        };
    }

    try {
        const ev = await prisma.event.findUnique({
            where: { id },
            select: {
                title: true,
                shortDescription: true,
                category: true,
                world: true,
                status: true,
            },
        });

        if (!ev || ev.status !== EventStatus.Published) {
            return {
                title: "Event Not Found",
                description: "The requested event could not be found.",
            };
        }

        // Security: Sanitize text for metadata
        const safeTitle = ev.title.slice(0, 60);
        const safeDescription = ev.shortDescription?.slice(0, 160) || 
            `${ev.category} event at ${ev.world} - Imaginears Club`;

        return {
            title: `${safeTitle} | Imaginears Events`,
            description: safeDescription,
            openGraph: {
                title: safeTitle,
                description: safeDescription,
                type: "website",
                siteName: "Imaginears Club",
                locale: "en_US",
            },
            twitter: {
                card: "summary_large_image",
                title: safeTitle,
                description: safeDescription,
                site: "@ImaginearsClub",
            },
            // Additional metadata for better SEO
            keywords: [
                "Imaginears",
                "Minecraft event",
                ev.category,
                ev.world,
                "Disney-inspired",
                "Theme park",
            ],
            authors: [{ name: "Imaginears Club" }],
            creator: "Imaginears Club",
            publisher: "Imaginears Club",
        };
    } catch (error) {
        console.error("[Metadata] Error generating metadata:", error);
        return {
            title: "Event | Imaginears",
            description: "View event details at Imaginears Club.",
        };
    }
}

/**
 * Performance: Generate static params for the most recent published events
 * This enables static generation at build time
 */
export async function generateStaticParams() {
    try {
        const events = await prisma.event.findMany({
            where: { status: EventStatus.Published },
            select: { id: true },
            orderBy: { updatedAt: "desc" },
            take: 50, // Pre-render top 50 most recent events
        });

        return events.map((event) => ({
            id: event.id,
        }));
    } catch (error) {
        console.error("[StaticParams] Error generating static params:", error);
        return [];
    }
}

export default async function EventPublicPage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15+: params is now a Promise
    const { id } = await params;
    
    // Security: Validate event ID format
    if (!isValidEventId(id)) {
        return notFound();
    }

    // Performance: Select only needed fields
    const ev = await prisma.event.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            world: true,
            category: true,
            details: true,
            shortDescription: true,
            startAt: true,
            endAt: true,
            status: true,
            timezone: true,
            recurrenceFreq: true,
            byWeekdayJson: true,
            timesJson: true,
            recurrenceUntil: true,
            updatedAt: true,
        },
    });

    // Security: Only show published events
    if (!ev || ev.status !== EventStatus.Published) {
        return notFound();
    }

    // Security: Sanitize timezone
    const tz = sanitizeTimezone(ev.timezone);
    const times = asStringArray(ev.timesJson);
    const weekdays = asWeekdayArray(ev.byWeekdayJson);

    // Performance: Build upcoming list only when helpful
    // - For DAILY: summary "Daily at …" is enough, skip noisy list
    // - For WEEKLY/NONE: show the next few upcoming
    const shouldShowUpcoming = ev.recurrenceFreq !== "DAILY";
    const now = new Date();
    const upcoming = shouldShowUpcoming
        ? expandEventOccurrences(
            ev as any, 
            now, 
            addDays(now, UPCOMING_DAYS_WINDOW), 
            MAX_OCCURRENCES_TO_EXPAND
        ).slice(0, MAX_UPCOMING_ITEMS)
        : [];

    // Get the next upcoming occurrence for the calendar button
    const nextOccurrence = upcoming.length > 0 ? upcoming[0] : null;
    const calendarStartTime = nextOccurrence ? nextOccurrence.start : ev.startAt;
    const calendarEndTime = nextOccurrence ? nextOccurrence.end : ev.endAt;

    return (
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <h1 className={cn(
                        "text-3xl md:text-4xl font-bold",
                        "text-slate-900 dark:text-white"
                    )}>
                        {ev.title}
                    </h1>
                    
                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <AddToCalendarButton
                            event={{
                                id: ev.id,
                                title: ev.title,
                                ...(ev.shortDescription && { description: ev.shortDescription }),
                                location: `${ev.world} @ Imaginears Club`,
                                startTime: calendarStartTime,
                                endTime: calendarEndTime,
                            }}
                            size="md"
                            variant="default"
                        />
                        <ShareButton
                            title={ev.title}
                            {...(ev.shortDescription && { description: ev.shortDescription })}
                            size="md"
                            variant="outline"
                        />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <CountdownBadge 
                        startAt={calendarStartTime} 
                        endAt={calendarEndTime} 
                        size="md" 
                        showIcon 
                    />
                    <ScheduleSummary
                        recurrenceFreq={ev.recurrenceFreq as any}
                        byWeekday={weekdays as any}
                        times={times}
                        timezone={tz}
                        until={ev.recurrenceUntil ?? null}
                    />
                    <Badge variant="primary" size="sm">
                        {ev.category}
                    </Badge>
                    <Badge variant="default" size="sm">
                        <MapPin className="w-3 h-3 mr-1" aria-hidden="true" />
                        {ev.world}
                    </Badge>
                </div>

                {ev.shortDescription && (
                    <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {ev.shortDescription}
                    </p>
                )}
            </header>

            <Separator className="my-6" />

            {/* Details (Markdown) */}
            {ev.details && (
                <section className="prose dark:prose-invert max-w-none mb-8">
                    <div className={cn(
                        "rounded-2xl border-2 p-6",
                        "border-slate-300 dark:border-slate-700",
                        "bg-white dark:bg-slate-900",
                        "shadow-sm"
                    )}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={safeRehypePlugins as any}
                            components={{
                                // Security: All external links open in new tab with security attributes
                                a: (props) => (
                                    <a 
                                        {...props} 
                                        className="text-blue-600 dark:text-blue-400 hover:underline" 
                                        target="_blank" 
                                        rel="noopener noreferrer nofollow"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                    />
                                ),
                                code: (props) => {
                                    const { children, className, ...rest } = props;
                                    const inline = (props as any).inline;
                                    return inline ? (
                                        <code className={cn(
                                            "px-1.5 py-0.5 rounded text-sm font-mono",
                                            "bg-slate-100 dark:bg-slate-800",
                                            "text-slate-900 dark:text-slate-100"
                                        )} {...rest}>
                                            {children}
                                        </code>
                                    ) : (
                                        <pre className={cn(
                                            "p-4 rounded-xl overflow-auto",
                                            "bg-slate-100 dark:bg-slate-800",
                                            "border border-slate-200 dark:border-slate-700"
                                        )}>
                                            <code {...rest} className={className}>
                                                {children}
                                            </code>
                                        </pre>
                                    );
                                },
                                table: (p) => (
                                    <div className="overflow-x-auto -mx-2">
                                        <table {...p} />
                                    </div>
                                ),
                            }}
                        >
                            {ev.details}
                        </ReactMarkdown>
                    </div>
                </section>
            )}

            {/* Upcoming (hidden for DAILY since the summary is sufficient) */}
            {shouldShowUpcoming && (
                <>
                    <Separator className="my-6" />
                    
                    <section className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                            <h2 className={cn(
                                "text-xl font-bold",
                                "text-slate-900 dark:text-white"
                            )}>
                                Upcoming Times
                            </h2>
                        </div>
                        
                        {upcoming.length === 0 ? (
                            <EmptyState
                                icon={<Calendar className="w-12 h-12" />}
                                title="No upcoming times"
                                description="This event currently has no scheduled occurrences in the next 3 weeks."
                            />
                        ) : (
                            <ul className="grid sm:grid-cols-2 gap-3">
                                {upcoming.map((occ) => (
                                    <li
                                        key={`${occ.eventId}-${occ.start.toISOString()}`}
                                        className={cn(
                                            "group rounded-xl border-2 p-4 transition-all duration-200",
                                            "bg-white dark:bg-slate-900",
                                            "border-slate-300 dark:border-slate-700",
                                            "hover:border-slate-400 dark:hover:border-slate-600",
                                            "hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200",
                                                "bg-blue-100 dark:bg-blue-900/30",
                                                "group-hover:scale-110"
                                            )}>
                                                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {formatLocalTime(occ.start, tz)}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                    {tz}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}

            <Separator className="my-8" />

            <footer className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Last updated {fmt(ev.updatedAt, "MMM d, yyyy 'at' h:mm a")}
            </footer>
        </div>
    );
}
