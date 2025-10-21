// components/events/ScheduleSummary.tsx
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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

function formatTimesHHmm(times: string[], tz: string) {
    // Render HH:mm strings as localized “h:mm a” in the given timezone (using today's date)
    const todayLocal = toZonedTime(new Date(), tz);
    return times
        .map((t) => {
            const [hh, mm] = (t || "00:00").split(":").map((n) => Number(n));
            const d = new Date(
                todayLocal.getFullYear(),
                todayLocal.getMonth(),
                todayLocal.getDate(),
                isNaN(hh) ? 0 : hh,
                isNaN(mm) ? 0 : mm,
                0,
                0
            );
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

    const timesText =
        times && times.length ? formatTimesHHmm([...new Set(times)].sort(), timezone) : null;
    const untilText = until ? ` through ${format(until, "MMM d, yyyy")}` : "";

    if (recurrenceFreq === "DAILY") {
        return (
            <span
                className={`inline-flex items-center gap-2 text-xs sm:text-sm rounded-xl border px-3 py-1.5 bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-200 ${className}`}
            >
        <span className="font-medium">Daily</span>
                {timesText && <span>at {timesText}</span>}
                <span className="opacity-70">({timezone}){untilText}</span>
      </span>
        );
    }

    if (recurrenceFreq === "WEEKLY") {
        const days = (byWeekday || []).map((d) => WEEKDAY_LABEL[d]).join(", ");
        return (
            <span
                className={`inline-flex items-center gap-2 text-xs sm:text-sm rounded-xl border px-3 py-1.5 bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-200 ${className}`}
            >
        <span className="font-medium">Weekly</span>
                {days && <span>on {days}</span>}
                {timesText && <span>at {timesText}</span>}
                <span className="opacity-70">({timezone}){untilText}</span>
      </span>
        );
    }

    // One-time: no summary pill
    return null;
}
