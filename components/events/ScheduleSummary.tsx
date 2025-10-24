// components/events/ScheduleSummary.tsx
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMemo } from "react";

export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
export type RecurrenceFreq = "NONE" | "DAILY" | "WEEKLY";

const WEEKDAY_LABEL: Record<Weekday, string> = {
    SU: "Sun",
    MO: "Mon",
    TU: "Tue",
    WE: "Wed",
    TH: "Thu",
    FR: "Fri",
    SA: "Sat",
};

// Validate HH:mm format (00:00 to 23:59)
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;

function isValidTimezone(tz: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
    const match = timeStr.match(TIME_REGEX);
    if (!match || !match[1] || !match[2]) {
        return { hours: 0, minutes: 0 };
    }
    return {
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10),
    };
}

function formatTimesHHmm(times: string[], tz: string): string {
    // Validate timezone
    if (!isValidTimezone(tz)) {
        return times.join(", ");
    }

    // Render HH:mm strings as localized "h:mm a" in the given timezone
    // Create reference date once, outside the map
    const todayLocal = toZonedTime(new Date(), tz);
    const year = todayLocal.getFullYear();
    const month = todayLocal.getMonth();
    const date = todayLocal.getDate();

    return times
        .map((t) => {
            const { hours, minutes } = parseTime(t);
            const d = new Date(year, month, date, hours, minutes, 0, 0);
            return format(d, "h:mm a");
        })
        .join(", ");
}

export default function ScheduleSummary(props: {
    recurrenceFreq: RecurrenceFreq;
    byWeekday?: Weekday[];
    times?: string[];
    timezone: string;
    until?: Date | null;
    className?: string;
}) {
    const { recurrenceFreq, byWeekday, times, timezone, until, className = "" } = props;

    // Memoize formatted times to avoid recalculation on every render
    const timesText = useMemo(() => {
        if (!times?.length) return null;
        const uniqueTimes = Array.from(new Set(times)).sort();
        return formatTimesHHmm(uniqueTimes, timezone);
    }, [times, timezone]);

    const untilText = until ? ` through ${format(until, "MMM d, yyyy")}` : "";

    if (recurrenceFreq === "DAILY") {
        return (
            <span
                className={`inline-flex flex-wrap items-center gap-1.5 text-xs sm:text-sm rounded-xl border px-3 py-1.5 bg-white border-sky-300 text-sky-700 dark:bg-sky-950/50 dark:border-sky-700 dark:text-sky-100 shadow-sm transition-colors ${className}`}
                role="status"
                aria-label={`Daily event${timesText ? ` at ${timesText}` : ""} ${timezone}${untilText}`}
            >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold">Daily</span>
                {timesText && (
                    <>
                        <span className="opacity-50">•</span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timesText}
                        </span>
                    </>
                )}
                <span className="opacity-60 text-[0.7rem] sm:text-xs">
                    {timezone}{untilText}
                </span>
            </span>
        );
    }

    if (recurrenceFreq === "WEEKLY") {
        const days = (byWeekday || []).map((d) => WEEKDAY_LABEL[d]).join(", ");
        return (
            <span
                className={`inline-flex flex-wrap items-center gap-1.5 text-xs sm:text-sm rounded-xl border px-3 py-1.5 bg-white border-violet-300 text-violet-700 dark:bg-violet-950/50 dark:border-violet-700 dark:text-violet-100 shadow-sm transition-colors ${className}`}
                role="status"
                aria-label={`Weekly event${days ? ` on ${days}` : ""}${timesText ? ` at ${timesText}` : ""} ${timezone}${untilText}`}
            >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold">Weekly</span>
                {days && (
                    <>
                        <span className="opacity-50">•</span>
                        <span>{days}</span>
                    </>
                )}
                {timesText && (
                    <>
                        <span className="opacity-50">•</span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timesText}
                        </span>
                    </>
                )}
                <span className="opacity-60 text-[0.7rem] sm:text-xs">
                    {timezone}{untilText}
                </span>
            </span>
        );
    }

    // One-time: no summary pill
    return null;
}
