// components/public/EventTeaser.tsx
import Link from "next/link";
import { PrismaClient, EventStatus } from "@prisma/client";
import ScheduleSummary, { type Weekday as SummaryWeekday, type RecurrenceFreq as SummaryRecurrenceFreq } from "@/components/events/ScheduleSummary";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

let _prisma: PrismaClient | null = null;
function prisma() {
    if (!_prisma) {
        _prisma = (globalThis as any).__PRISMA__ ?? new PrismaClient();
        (globalThis as any).__PRISMA__ = _prisma;
    }
    return _prisma!;
}

type Props = {
    title?: string;
    limit?: number;
};

// Safely coerce limit to a sane integer range
function clampLimit(v: unknown, min = 1, max = 24, fallback = 6): number {
    const n = typeof v === "number" ? v : Number(v);
    const safe = Number.isFinite(n) ? Math.floor(n) : fallback;
    return Math.min(max, Math.max(min, safe));
}

// Robustly coerce an unknown value into string[]
function asStringArray(v: unknown): string[] {
    try {
        const val = typeof v === "string" ? JSON.parse(v) : v;
        return Array.isArray(val) ? val.filter((x) => typeof x === "string") : [];
    } catch {
        return [];
    }
}

function asWeekdayArray(v: unknown): SummaryWeekday[] {
    const s = asStringArray(v);
    const allow = new Set<SummaryWeekday>(["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as SummaryWeekday[]);
    // de-dupe, filter invalid, keep stable order of first occurrence
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

function isValidTimeZone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
        return true;
    } catch {
        return false;
    }
}

// Cache published events to reduce DB load and improve TTFB
const getPublishedEvents = unstable_cache(
    async (take: number) => {
        try {
            return await prisma().event.findMany({
                where: { status: EventStatus.Published },
                orderBy: [{ recurrenceFreq: "desc" }, { updatedAt: "desc" }],
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
                },
            });
        } catch (err) {
            console.error("EventTeaser: failed to load events", err);
            return [] as Array<{
                id: string;
                title: string;
                world: string | null;
                category: string | null;
                shortDescription: string | null;
                timezone: string | null;
                recurrenceFreq: any;
                byWeekdayJson: unknown;
                timesJson: unknown;
                recurrenceUntil: Date | null;
            }>;
        }
    },
    ["event-teaser"],
    { revalidate: 300, tags: ["events"] }
);

export default async function EventTeaser({ title = "Events", limit = 6 }: Props) {
    const take = clampLimit(limit);
    const events = await getPublishedEvents(take);

    return (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 mt-10">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{title}</h2>
                <Link href="/events" className="text-sm underline underline-offset-4 hover:no-underline">
                    View all →
                </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((e) => {
                    const tzRaw = e.timezone || "America/New_York";
                    const tz = isValidTimeZone(tzRaw) ? tzRaw : "America/New_York";
                    const byWeekday = asWeekdayArray(e.byWeekdayJson);
                    const times = asStringArray(e.timesJson);
                    const recurrenceFreq = (e.recurrenceFreq as unknown) as SummaryRecurrenceFreq;

                    return (
                        <article
                            key={e.id}
                            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 hover:shadow-md transition-shadow"
                        >
                            <header className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-semibold leading-snug">
                                    <Link href={`/events/${e.id}`} className="hover:underline">
                                        {e.title}
                                    </Link>
                                </h3>
                                <span className="text-xs rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-slate-600 dark:text-slate-300 shrink-0">
                  {e.category}
                </span>
                            </header>

                            <div className="mt-2">
                                <ScheduleSummary
                                    recurrenceFreq={recurrenceFreq}
                                    byWeekday={byWeekday}
                                    times={times}
                                    timezone={tz}
                                    until={e.recurrenceUntil ?? null}
                                    className="mt-1"
                                />
                            </div>

                            {e.shortDescription && (
                                <p className="mt-3 text-sm text-body line-clamp-3">
                                    {e.shortDescription}
                                </p>
                            )}

                            <footer className="mt-4">
                                <Link
                                    href={`/events/${e.id}`}
                                    className="inline-flex items-center gap-1 text-sm underline underline-offset-4 hover:no-underline"
                                >
                                    View details →
                                </Link>
                            </footer>
                        </article>
                    );
                })}

                {!events.length && (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-slate-500">
                        No events to show yet.
                    </div>
                )}
            </div>
        </section>
    );
}
