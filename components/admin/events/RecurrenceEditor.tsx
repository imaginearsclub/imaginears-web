"use client";

import { useEffect, useRef, useState } from "react";
import type { Weekday, RecurrenceFreq } from "@prisma/client";
import { Tooltip, Alert, Separator } from "@/components/common";
import { cn } from "@/lib/utils";
import { Plus, X, Clock, Info } from "lucide-react";

const WEEKDAYS: { code: Weekday; label: string }[] = [
    { code: "SU", label: "Sun" },
    { code: "MO", label: "Mon" },
    { code: "TU", label: "Tue" },
    { code: "WE", label: "Wed" },
    { code: "TH", label: "Thu" },
    { code: "FR", label: "Fri" },
    { code: "SA", label: "Sat" },
];

export type RecurrenceValue = {
    timezone: string;
    recurrenceFreq: RecurrenceFreq; // NONE | DAILY | WEEKLY
    byWeekday: Weekday[];           // weekly only
    times: string[];                // ["15:00","18:00","21:00"] (24h)
    recurrenceUntil?: string | null; // yyyy-mm-dd or null
};

function deepEqual(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeTimes(times: string[]): string[] {
    // keep HH:mm only, dedupe, sort
    const clean = times
        .map((t) => (t || "").slice(0, 5))
        .map((t) => {
            // browser time inputs already HH:mm, but protect anyway
            const m = /^(\d{2}):(\d{2})$/.exec(t);
            if (!m) return null;
            const hh = Math.max(0, Math.min(23, Number(m[1])));
            const mm = Math.max(0, Math.min(59, Number(m[2])));
            return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        })
        .filter(Boolean) as string[];

    const dedup = Array.from(new Set(clean));
    return dedup.sort(); // string sort ok for HH:mm
}

export default function RecurrenceEditor({
                                             value,
                                             onChange,
                                         }: {
    value: RecurrenceValue;
    onChange: (v: RecurrenceValue) => void;
}) {
    // Local, controlled copy to avoid resets during parent re-renders
    const [v, setV] = useState<RecurrenceValue>(() => ({
        timezone: value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
        recurrenceFreq: value.recurrenceFreq || "NONE",
        byWeekday: Array.isArray(value.byWeekday) ? value.byWeekday : [],
        times: Array.isArray(value.times) ? value.times : [],
        recurrenceUntil: value.recurrenceUntil ?? null,
    }));

    // Only sync-in if the incoming value truly changed (prevents “clears”)
    useEffect(() => {
        const next: RecurrenceValue = {
            timezone: value.timezone || v.timezone,
            recurrenceFreq: value.recurrenceFreq || v.recurrenceFreq,
            byWeekday: Array.isArray(value.byWeekday) ? value.byWeekday : [],
            times: Array.isArray(value.times) ? value.times : [],
            recurrenceUntil: value.recurrenceUntil ?? null,
        };
        if (!deepEqual(next, v)) setV(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Debounced up-prop
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (pending.current) clearTimeout(pending.current);
        pending.current = setTimeout(() => {
            onChange({ ...v, times: normalizeTimes(v.times) });
        }, 60);
        return () => {
            if (pending.current) clearTimeout(pending.current);
        };
    }, [v, onChange]);

    const weeklyHint =
        v.recurrenceFreq === "WEEKLY" && (!v.byWeekday || v.byWeekday.length === 0);

    function addTime(t: string = "00:00") {
        setV((cur) => ({ ...cur, times: normalizeTimes([...(cur.times || []), t]) }));
    }

    function updateTime(i: number, t: string) {
        setV((cur) => {
            const next = [...(cur.times || [])];
            next[i] = t;
            return { ...cur, times: next };
        });
    }

    function removeTime(i: number) {
        setV((cur) => ({ ...cur, times: (cur.times || []).filter((_, idx) => idx !== i) }));
    }

    function toggleDay(code: Weekday) {
        setV((cur) => {
            const set = new Set(cur.byWeekday || []);
            set.has(code) ? set.delete(code) : set.add(code);
            return { ...cur, byWeekday: Array.from(set) as Weekday[] };
        });
    }

    function applyPreset(times: string[]) {
        setV((cur) => ({ ...cur, times: normalizeTimes([...(cur.times || []), ...times]) }));
    }

    function setPreset(times: string[]) {
        setV((cur) => ({ ...cur, times: normalizeTimes(times) }));
    }

    return (
        <div className="space-y-5">
            <div>
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Recurrence</label>
                <select
                    value={v.recurrenceFreq}
                    onChange={(e) => setV({ ...v, recurrenceFreq: e.target.value as RecurrenceFreq })}
                    className={cn(
                        "mt-2 w-full rounded-xl border-2 px-4 py-3",
                        "bg-white dark:bg-slate-900",
                        "border-slate-300 dark:border-slate-700",
                        "text-slate-900 dark:text-white",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                        "transition-all"
                    )}
                >
                    <option value="NONE">One-time</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                </select>
                {v.recurrenceFreq === "NONE" && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        The Start/End times you set above will be used once.
                    </p>
                )}
            </div>

            {v.recurrenceFreq === "WEEKLY" && (
                <>
                    <Separator />
                    <div>
                        <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Days of week</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {WEEKDAYS.map((d) => {
                                const active = (v.byWeekday || []).includes(d.code);
                                return (
                                    <button
                                        key={d.code}
                                        type="button"
                                        onClick={() => toggleDay(d.code)}
                                        className={cn(
                                            "rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                                            active
                                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        )}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                        {weeklyHint && (
                            <Alert variant="warning" className="mt-3">
                                Choose at least one weekday for weekly recurrence.
                            </Alert>
                        )}
                    </div>
                </>
            )}

            {v.recurrenceFreq !== "NONE" && (
                <>
                    <Separator />
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Showtimes (local, 24h)
                            </label>
                            <div className="flex gap-2">
                                {/* Quick presets */}
                                <Tooltip content="Replace with 3pm, 6pm, 9pm" side="top">
                                    <button
                                        type="button"
                                        className={cn(
                                            "px-2 py-1 text-xs font-medium rounded-lg",
                                            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                                            "hover:bg-slate-200 dark:hover:bg-slate-700",
                                            "transition-colors"
                                        )}
                                        onClick={() => setPreset(["15:00", "18:00", "21:00"])}
                                    >
                                        Set 3p/6p/9p
                                    </button>
                                </Tooltip>
                                <Tooltip content="Add 3pm, 6pm, 9pm to existing times" side="top">
                                    <button
                                        type="button"
                                        className={cn(
                                            "px-2 py-1 text-xs font-medium rounded-lg",
                                            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                                            "hover:bg-slate-200 dark:hover:bg-slate-700",
                                            "transition-colors"
                                        )}
                                        onClick={() => applyPreset(["15:00", "18:00", "21:00"])}
                                    >
                                        + 3p/6p/9p
                                    </button>
                                </Tooltip>
                                <Tooltip content="Replace with single noon show" side="top">
                                    <button
                                        type="button"
                                        className={cn(
                                            "px-2 py-1 text-xs font-medium rounded-lg",
                                            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                                            "hover:bg-slate-200 dark:hover:bg-slate-700",
                                            "transition-colors"
                                        )}
                                        onClick={() => setPreset(["12:00"])}
                                    >
                                        Set 12:00
                                    </button>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Time list */}
                        <div className="space-y-2">
                            {(v.times && v.times.length ? v.times : ["15:00"]).map((t, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={t}
                                        onChange={(e) => updateTime(i, e.target.value)}
                                        step={60}
                                        className={cn(
                                            "w-40 rounded-xl border-2 px-3 py-2",
                                            "bg-white dark:bg-slate-900",
                                            "border-slate-300 dark:border-slate-700",
                                            "text-slate-900 dark:text-white",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                                            "transition-all"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium",
                                            "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
                                            "border border-red-200 dark:border-red-800",
                                            "hover:bg-red-100 dark:hover:bg-red-900/30",
                                            "transition-colors"
                                        )}
                                        onClick={() => removeTime(i)}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium",
                                    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
                                    "border border-blue-200 dark:border-blue-800",
                                    "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                                    "transition-colors"
                                )}
                                onClick={() => addTime("00:00")}
                            >
                                <Plus className="w-4 h-4" />
                                Add time
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            Times are interpreted in the selected timezone below and expanded to UTC automatically.
                        </p>
                    </div>
                </>
            )}

            <Separator />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Timezone</label>
                    <select
                        value={v.timezone}
                        onChange={(e) => setV({ ...v, timezone: e.target.value })}
                        className={cn(
                            "mt-2 w-full rounded-xl border-2 px-4 py-3",
                            "bg-white dark:bg-slate-900",
                            "border-slate-300 dark:border-slate-700",
                            "text-slate-900 dark:text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                            "transition-all"
                        )}
                    >
                        {(Intl as any).supportedValuesOf?.("timeZone")?.map((tz: string) => (
                            <option key={tz}>{tz}</option>
                        )) || <option>America/New_York</option>}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Repeat until (optional)</label>
                    <input
                        type="date"
                        value={v.recurrenceUntil ?? ""}
                        onChange={(e) => setV({ ...v, recurrenceUntil: e.target.value || null })}
                        className={cn(
                            "mt-2 w-full rounded-xl border-2 px-4 py-3",
                            "bg-white dark:bg-slate-900",
                            "border-slate-300 dark:border-slate-700",
                            "text-slate-900 dark:text-white",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                            "transition-all"
                        )}
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        Leave blank to repeat indefinitely.
                    </p>
                </div>
            </div>
        </div>
    );
}
