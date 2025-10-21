import { toZonedTime } from "date-fns-tz";
import { addDays, isAfter, isBefore, set } from "date-fns";
import type { Event, Weekday } from "@prisma/client";

export type Occurrence = {
    eventId: string;
    title: string;
    start: Date; // UTC
    end: Date;   // UTC
    timezone: string;
    world: string;
    category: string;
};

const WD_MAP: Record<Weekday, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function parseHHmm(s: string) {
    const m = /^(\d{2}):(\d{2})$/.exec(s);
    if (!m) return { hh: 0, mm: 0 };
    return { hh: Number(m[1]), mm: Number(m[2]) };
}

function toHHmmFromDate(d: Date, tz: string) {
    const local = ToZonedTime(d, tz);
    const hh = local.getHours().toString().padStart(2, "0");
    const mm = local.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
}

// Safe JSON readers (because Prisma Json is `unknown`)
function asStringArray(v: unknown): string[] {
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
    return [];
}
function asWeekdayArray(v: unknown): Weekday[] {
    const s = asStringArray(v);
    const allowed = new Set<Weekday>(["SU","MO","TU","WE","TH","FR","SA"] as Weekday[]);
    return s.filter((x): x is Weekday => allowed.has(x as Weekday));
}

/** Expand one event into UTC occurrences between `from`..`until` */
export function expandEventOccurrences(
    ev: Event,
    from: Date,
    until: Date,
    limit = 200
): Occurrence[] {
    const out: Occurrence[] = [];
    const tz = ev.timezone || "America/New_York";
    const durationMs = Math.max(1, new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime());

    const windowEnd =
        ev.recurrenceUntil && isBefore(until, ev.recurrenceUntil) ? until : ev.recurrenceUntil || until;

    if (ev.recurrenceFreq === "NONE") {
        if (!isBefore(ev.startAt, from) && !isAfter(ev.startAt, windowEnd)) {
            out.push({
                eventId: ev.id,
                title: ev.title,
                start: new Date(ev.startAt),
                end: new Date(ev.endAt),
                timezone: tz,
                world: ev.world,
                category: ev.category,
            });
        }
        return out;
    }

    let cursorLocal = toZonedTime(ev.startAt, tz);
    const fromLocal = toZonedTime(from, tz);
    if (isAfter(fromLocal, cursorLocal)) {
        cursorLocal = set(fromLocal, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    } else {
        cursorLocal = set(cursorLocal, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    }
    const endLocal = toZonedTime(windowEnd, tz);

    const times = asStringArray(ev.timesJson);
    const weekdays = asWeekdayArray(ev.byWeekdayJson);
    const timesOrDefault = times.length ? times : [toHHmmFromDate(ev.startAt, tz)];

    const pushForDay = (localDay: Date) => {
        for (const t of timesOrDefault) {
            const { hh, mm } = parseHHmm(t);
            const localStart = set(localDay, { hours: hh, minutes: mm, seconds: 0, milliseconds: 0 });
            const utcStart = toZonedTime(localStart, tz);
            if (isBefore(utcStart, from) || isAfter(utcStart, windowEnd)) continue;
            const utcEnd = new Date(utcStart.getTime() + durationMs);
            out.push({
                eventId: ev.id,
                title: ev.title,
                start: utcStart,
                end: utcEnd,
                timezone: tz,
                world: ev.world,
                category: ev.category,
            });
            if (out.length >= limit) return true;
        }
        return false;
    };

    while (!isAfter(cursorLocal, endLocal) && out.length < limit) {
        const weekday = cursorLocal.getDay(); // 0..6

        if (ev.recurrenceFreq === "DAILY") {
            if (pushForDay(cursorLocal)) break;
        } else if (ev.recurrenceFreq === "WEEKLY") {
            const allowed = new Set((weekdays || []).map((w) => WD_MAP[w]));
            if (allowed.has(weekday)) {
                if (pushForDay(cursorLocal)) break;
            }
        }

        cursorLocal = addDays(cursorLocal, 1);
    }

    return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}
