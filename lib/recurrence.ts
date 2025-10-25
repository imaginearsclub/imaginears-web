import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, isAfter, isBefore, set, isValid } from "date-fns";
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

const WD_MAP: Record<Weekday, number> = Object.freeze({ SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 });

// Pre-compiled regex for performance (compiled once, not per call)
const TIME_PATTERN = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

// Maximum allowed time slots to prevent DoS
const MAX_TIME_SLOTS = 50;

// Validate timezone string to prevent injection attacks
function isValidTimezone(tz: string): boolean {
    // Basic validation: alphanumeric, underscores, slashes, hyphens only
    if (!/^[A-Za-z0-9_/-]+$/.test(tz)) return false;
    // Additional length check to prevent abuse
    if (tz.length > 50) return false;
    try {
        // Test if timezone is valid by attempting to use it
        toZonedTime(new Date(), tz);
        return true;
    } catch {
        return false;
    }
}

function parseHHmm(s: string): { hh: number; mm: number } | null {
    // Guard against extremely long strings before regex
    if (s.length > 10) return null;
    
    const trimmed = s.trim();
    const m = TIME_PATTERN.exec(trimmed);
    if (!m) return null;
    
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    // Regex already validates range, but double-check for safety
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    
    return { hh, mm };
}

function toHHmmFromDate(d: Date, tz: string) {
    const local = toZonedTime(d, tz);
    const hh = local.getHours().toString().padStart(2, "0");
    const mm = local.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
}

// Safe JSON readers (because Prisma Json is `unknown`)
// Pre-allocated Set for performance (avoid creating new Set on each call)
const ALLOWED_WEEKDAYS = Object.freeze(new Set<Weekday>(["SU","MO","TU","WE","TH","FR","SA"]));

function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    // Filter and validate string length to prevent memory issues
    return v.filter((x) => typeof x === "string" && x.length < 100) as string[];
}

function asWeekdayArray(v: unknown): Weekday[] {
    const s = asStringArray(v);
    return s.filter((x): x is Weekday => ALLOWED_WEEKDAYS.has(x as Weekday));
}

/** Expand one event into UTC occurrences between `from`..`until` */
export function expandEventOccurrences(
    ev: Event,
    from: Date,
    until: Date,
    limit = 200
): Occurrence[] {
    const out: Occurrence[] = [];
    
    // Validate inputs without redundant instanceof checks; ensures Dates are valid
    if (!ev || !isValid(from) || !isValid(until)) return out;
    if (isAfter(from, until)) return out;
    
    // Validate event dates exist and are valid
    if (!ev.startAt || !ev.endAt || !isValid(ev.startAt) || !isValid(ev.endAt)) return out;
    
    // Validate startAt comes before endAt (prevent negative duration)
    if (!isBefore(ev.startAt, ev.endAt)) return out;
    
    // Validate and sanitize timezone
    const tz = ev.timezone || "America/New_York";
    if (!isValidTimezone(tz)) {
        // Fall back to safe default if timezone is invalid
        console.warn(`[Security] Invalid timezone detected: ${tz}`);
        return out;
    }
    
    // Validate required fields exist
    if (!ev.id || !ev.title || !ev.world || !ev.category) return out;
    
    const safeLimit = Math.min(Math.max(1, Math.trunc(limit ?? 200)), 1000);
    const durationMs = new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime();

    const windowEnd =
        ev.recurrenceUntil && isBefore(until, ev.recurrenceUntil) ? until : ev.recurrenceUntil || until;

    if (ev.recurrenceFreq === "NONE") {
        // Show event if it ends after 'from' (includes ongoing events) and starts before 'windowEnd'
        if (!isBefore(ev.endAt, from) && !isAfter(ev.startAt, windowEnd)) {
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
    const timesBase = times.length ? times : [toHHmmFromDate(ev.startAt, tz)];
    
    // Limit number of time slots to prevent DoS attacks
    const limitedTimes = timesBase.slice(0, MAX_TIME_SLOTS);
    
    const sortedTimes = limitedTimes
        .map((s) => s.trim())
        .filter((s) => !!parseHHmm(s))
        .sort((a, b) => {
            const pa = parseHHmm(a)!;
            const pb = parseHHmm(b)!;
            return pa.hh * 60 + pa.mm - (pb.hh * 60 + pb.mm);
        });
    
    // If no valid times, return early (data corruption or attack)
    if (sortedTimes.length === 0) return out;

    // Pre-compute allowed weekdays Set for WEEKLY frequency (optimization)
    const weeklyAllowed = new Set(weekdays.map((w) => WD_MAP[w]));

    const pushForDay = (localDay: Date): boolean => {
        for (const t of sortedTimes) {
            const parsed = parseHHmm(t);
            if (!parsed) continue;
            const { hh, mm } = parsed;
            
            const localStart = set(localDay, { hours: hh, minutes: mm, seconds: 0, milliseconds: 0 });
            
            // Validate the resulting date is valid (protect against DST issues)
            if (!isValid(localStart)) continue;
            
            const utcStart = fromZonedTime(localStart, tz);
            const utcEnd = new Date(utcStart.getTime() + durationMs);
            
            // Validate end date is valid
            if (!isValid(utcEnd)) continue;
            
            // Skip occurrences outside the requested window (include ongoing: end > from)
            if (isBefore(utcEnd, from) || isAfter(utcStart, windowEnd)) continue;
            
            out.push({
                eventId: ev.id,
                title: ev.title,
                start: utcStart,
                end: utcEnd,
                timezone: tz,
                world: ev.world,
                category: ev.category,
            });
            
            // Stop if we've reached the limit
            if (out.length >= safeLimit) return true;
        }
        return false;
    };

    while (!isAfter(cursorLocal, endLocal) && out.length < safeLimit) {
        const weekday = cursorLocal.getDay(); // 0..6

        if (ev.recurrenceFreq === "DAILY") {
            if (pushForDay(cursorLocal)) break;
        } else if (ev.recurrenceFreq === "WEEKLY") {
            if (weeklyAllowed.has(weekday)) {
                if (pushForDay(cursorLocal)) break;
            }
        }

        cursorLocal = addDays(cursorLocal, 1);
    }

    return out;
}
