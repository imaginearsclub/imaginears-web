"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { formatInZone, SITE_TZ, isSameInstant } from "@/app/utils/timezone";

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

// Derive unique worlds from provided events to avoid stale/static options
// Keeps component resilient to backend/world changes

export default function EventsPublicFilter({ events }: { events: EventItem[] }) {
    const [q, setQ] = useState("");
    const qDeferred = useDeferredValue(q);
    const [cat, setCat] = useState<"All" | keyof typeof CATEGORY_LABEL>("All");
    const [world, setWorld] = useState<"All" | string>("All");

    const CATEGORY_KEYS = useMemo(() => Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>, []);
    const isCategory = (v: string): v is keyof typeof CATEGORY_LABEL => CATEGORY_KEYS.includes(v as any);

    const worlds = useMemo(() => {
        const set = new Set<string>();
        for (const e of events) {
            if (e.world) set.add(e.world);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [events]);

    const qNorm = useMemo(() => qDeferred.trim().toLowerCase(), [qDeferred]);

    const filtered = useMemo(() => {
        return events.filter(e => {
            if (cat !== "All" && e.category !== cat) return false;
            if (world !== "All" && e.world !== world) return false;

            if (qNorm) {
                const hay = `${e.title} ${e.world} ${CATEGORY_LABEL[e.category]}`.toLowerCase();
                if (!hay.includes(qNorm)) return false;
            }
            return true;
        });
    }, [events, qNorm, cat, world]);

    const safeFormat = (iso: string) => {
        try {
            return formatInZone(iso, SITE_TZ);
        } catch {
            return iso;
        }
    };

    return (
        <div className="card bg-white text-slate-900 border border-slate-200">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex-1">
                    <input
                        type="search"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search events…"
                        className="w-full rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-4 py-3 outline-none focus:ring-2 focus:ring-brandStart/50"
                    />
                </div>
                <div className="flex gap-3">
                    <select
                        value={cat}
                        onChange={e => {
                                                    const v = e.target.value;
                                                    setCat(v === "All" ? "All" : (isCategory(v) ? v : "All"));
                                                }}
                        className="rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3"
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
                        onChange={e => {
                                                    const v = e.target.value;
                                                    setWorld(v === "All" ? "All" : (worlds.includes(v) ? v : "All"));
                                                }}
                        className="rounded-2xl border border-slate-300 bg-white text-slate-900 px-4 py-3"
                    >
                        <option value="All">All Worlds</option>
                        {worlds.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 && (
                    <div className="col-span-full text-center text-slate-600">
                        No events match your filters.
                    </div>
                )}

                {filtered.map(e => {
                    const start = safeFormat(e.startAt);
                    const endSame = isSameInstant(e.startAt, e.endAt);
                    const end = endSame ? null : safeFormat(e.endAt);
                    const catLabel = CATEGORY_LABEL[e.category];

                    return (
                        <article key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-2 text-xs mb-2">
                <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-700">
                  {catLabel}
                </span>
                                <span className="text-slate-500">{e.world}</span>
                            </div>

                            <h3 className="text-lg font-semibold">{e.title}</h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-3">
                                {e.shortDescription ?? "Join us for a magical experience!"}
                            </p>

                            <div className="mt-3 text-xs text-slate-600">
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
