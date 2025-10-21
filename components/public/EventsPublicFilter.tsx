"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatInZone, SITE_TZ } from "@/app/utils/timezone";

type EventItem = {
    id: string;
    title: string;
    world: string;
    startAt: string;    // ISO string from API/Prisma serialization
    endAt: string;      // ISO
    status: "Draft" | "Scheduled" | "Published" | "Archived";
    category: "Fireworks" | "SeasonalOverlay" | "MeetAndGreet" | "Parade" | "Other";
    shortDescription?: string | null;
};

const CATEGORY_LABEL: Record<EventItem["category"], string> = {
    Fireworks: "Fireworks",
    SeasonalOverlay: "Seasonal Overlay",
    MeetAndGreet: "Meet & Greet",
    Parade: "Parade",
    Other: "Other",
};

const WORLDS = ["Magic Kingdom", "EPCOT", "Tomorrowland", "Fantasyland", "Main Street"] as const;

export default function EventsPublicFilter({ events }: { events: EventItem[] }) {
    const [q, setQ] = useState("");
    const [cat, setCat] = useState<"All" | keyof typeof CATEGORY_LABEL>("All");
    const [world, setWorld] = useState<"All" | typeof WORLDS[number]>("All");

    const filtered = useMemo(() => {
        return events.filter(e => {
            if (cat !== "All" && e.category !== cat) return false;
            if (world !== "All" && e.world !== world) return false;
            if (q && !`${e.title} ${e.world} ${CATEGORY_LABEL[e.category]}`.toLowerCase().includes(q.toLowerCase())) return false;
            return true;
        });
    }, [events, q, cat, world]);

    return (
        <div className="card">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex-1">
                    <input
                        type="search"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search events…"
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-brandStart/50"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={cat}
                        onChange={e => setCat(e.target.value as any)}
                        className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3"
                    >
                        <option value="All">All Categories</option>
                        <option value="Fireworks">Fireworks</option>
                        <option value="SeasonalOverlay">Seasonal Overlay</option>
                        <option value="MeetAndGreet">Meet &amp; Greet</option>
                        <option value="Parade">Parade</option>
                        <option value="Other">Other</option>
                    </select>

                    <select
                        value={world}
                        onChange={e => setWorld(e.target.value as any)}
                        className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3"
                    >
                        <option value="All">All Worlds</option>
                        {WORLDS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 dark:text-slate-400">
                        No events match your filters.
                    </div>
                )}

                {filtered.map(e => {
                    const start = formatInZone(new Date(e.startAt).toISOString(), SITE_TZ);
                    const endSame = e.startAt === e.endAt;
                    const end = endSame ? null : formatInZone(new Date(e.endAt).toISOString(), SITE_TZ);
                    const catLabel = CATEGORY_LABEL[e.category];

                    return (
                        <article key={e.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-2 text-xs mb-2">
                <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  {catLabel}
                </span>
                                <span className="text-slate-500 dark:text-slate-400">{e.world}</span>
                            </div>

                            <h3 className="text-lg font-semibold">{e.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                                {e.shortDescription ?? "Join us for a magical experience!"}
                            </p>

                            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                                {start}{end ? ` — ${end}` : ""} <span className="text-[10px]">({SITE_TZ})</span>
                            </div>

                            <Link href={`/events/${e.id}`} className="mt-3 inline-block text-indigo-600 hover:underline">
                                View details →
                            </Link>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
