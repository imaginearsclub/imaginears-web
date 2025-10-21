import { DateTime } from "luxon";

export const SITE_TZ = "America/New_York";

/** Internal: coerce input into a Luxon DateTime in UTC */
function toUTCDateTime(input: string | Date) {
    if (typeof input === "string") {
        return DateTime.fromISO(input, { zone: "utc" });
    }
    if (input instanceof Date) {
        return DateTime.fromJSDate(input, { zone: "utc" });
    }
    // Fallback: try to parse whatever it is as ISO string
    return DateTime.fromISO(String(input), { zone: "utc" });
}

/** Format UTC instant (string or Date) → readable date/time in a zone */
export function formatInZone(instantUTC: string | Date, zone: string = SITE_TZ) {
    return toUTCDateTime(instantUTC)
        .setZone(zone)
        .toFormat("LLL dd, hh:mm a");
}

/** Compare two UTC instants (string or Date) for equality */
export function isSameInstant(a: string | Date, b: string | Date) {
    return toUTCDateTime(a).toMillis() === toUTCDateTime(b).toMillis();
}

/** Convert local date+time (wall clock) in zone → UTC ISO */
export function toISOFromLocalParts(date: string, time: string, zone: string = SITE_TZ) {
    const [y, m, d] = date.split("-").map(Number);
    const [H, M] = time.split(":").map(Number);
    return DateTime.fromObject({ year: y, month: m, day: d, hour: H, minute: M }, { zone })
        .toUTC()
        .toISO();
}

/** Convert UTC ISO → local date+time strings for inputs */
export function isoToLocalParts(isoUTC: string, zone: string = SITE_TZ) {
    const dt = DateTime.fromISO(isoUTC, { zone: "utc" }).setZone(zone);
    return {
        date: dt.toFormat("yyyy-LL-dd"),
        time: dt.toFormat("HH:mm"),
    };
}
