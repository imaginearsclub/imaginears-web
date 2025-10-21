// components/public/EventTeaser.tsx
import Link from "next/link";
import { PrismaClient, EventStatus, type Weekday } from "@prisma/client";
import ScheduleSummary from "@/components/events/ScheduleSummary";

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

function asStringArray(v: unknown): string[] {
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
function asWeekdayArray(v: unknown): Weekday[] {
    const s = asStringArray(v);
    const allow = new Set<Weekday>(["SU","MO","TU","WE","TH","FR","SA"] as Weekday[]);
    return s.filter((x): x is Weekday => allow.has(x as Weekday));
}

export default async function EventTeaser({ title = "Events", limit = 6 }: Props) {
    const events = await prisma().event.findMany({
        where: { status: EventStatus.Published },
        orderBy: [{ recurrenceFreq: "desc" }, { updatedAt: "desc" }],
        take: Math.max(1, Math.min(limit, 24)),
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
                    const tz = e.timezone || "America/New_York";
                    const byWeekday = asWeekdayArray(e.byWeekdayJson);
                    const times = asStringArray(e.timesJson);

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
                                    recurrenceFreq={e.recurrenceFreq as any}
                                    byWeekday={byWeekday as any}
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
