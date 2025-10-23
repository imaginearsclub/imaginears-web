import { notFound } from "next/navigation";
import { EventStatus, type Weekday } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expandEventOccurrences } from "@/lib/recurrence";
import { addDays, format as fmt } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeRehypePlugins } from "@/lib/markdown";
import ScheduleSummary from "@/components/events/ScheduleSummary";

export const runtime = "nodejs";

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

export default async function EventPublicPage({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15+: params is now a Promise
    const { id } = await params;
    
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

    if (!ev || ev.status !== EventStatus.Published) return notFound();

    const tz = ev.timezone || "America/New_York";
    const times = asStringArray(ev.timesJson);
    const weekdays = asWeekdayArray(ev.byWeekdayJson);

    // Build upcoming list only when helpful:
    // - For DAILY: summary “Daily at …” is enough, skip noisy list
    // - For WEEKLY/NONE: show the next few upcoming
    const shouldShowUpcoming = ev.recurrenceFreq !== "DAILY";
    const now = new Date();
    const upcoming = shouldShowUpcoming
        ? expandEventOccurrences(ev as any, now, addDays(now, 21), 300).slice(0, 12)
        : [];

    return (
        <div className="mx-auto max-w-4xl p-4 sm:p-6">
            <header className="mb-4">
                <h1 className="text-3xl font-bold">{ev.title}</h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ScheduleSummary
                        recurrenceFreq={ev.recurrenceFreq as any}
                        byWeekday={weekdays as any}
                        times={times}
                        timezone={tz}
                        until={ev.recurrenceUntil ?? null}
                    />
                    <span className="inline-flex items-center text-xs rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300">
            {ev.category}
          </span>
                    <span className="inline-flex items-center text-xs rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300">
            World: {ev.world}
          </span>
                </div>

                {ev.shortDescription && (
                    <p className="mt-3 text-body">{ev.shortDescription}</p>
                )}
            </header>

            {/* Details (Markdown) */}
            {ev.details && (
                <section className="prose dark:prose-invert max-w-none">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={safeRehypePlugins as any}
                            components={{
                                a: (props) => <a {...props} className="underline" target="_blank" rel="noopener noreferrer nofollow" />,
                                code: ({ inline, className, children, ...rest }) =>
                                    inline ? (
                                        <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800" {...rest}>
                                            {children}
                                        </code>
                                    ) : (
                                        <pre className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-auto">
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    </pre>
                                    ),
                                table: (p) => (
                                    <div className="overflow-x-auto">
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
                <section className="mt-8">
                    <h2 className="text-lg font-semibold">Upcoming Times</h2>
                    {upcoming.length === 0 ? (
                        <p className="mt-2 text-slate-600 dark:text-slate-400">No upcoming times scheduled.</p>
                    ) : (
                        <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                            {upcoming.map((occ) => (
                                <li
                                    key={`${occ.eventId}-${occ.start.toISOString()}`}
                                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2"
                                >
                                    <div className="text-sm font-medium">{formatLocalTime(occ.start, tz)}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">{tz}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <footer className="mt-10 text-xs text-slate-500 dark:text-slate-400">
                Last updated {fmt(ev.updatedAt, "MMM d, yyyy h:mm a")}
            </footer>
        </div>
    );
}
