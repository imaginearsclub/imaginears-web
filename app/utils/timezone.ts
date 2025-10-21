import { DateTime } from "luxon";

export const SITE_TZ = "America/New_York";

/** Format UTC ISO → readable date/time in zone */
export function formatInZone(isoUTC: string, zone: string = SITE_TZ) {
    return DateTime.fromISO(isoUTC, { zone: "utc" })
        .setZone(zone)
        .toFormat("LLL dd, hh:mm a");
}

/** Compare two UTC ISO instants */
export function isSameInstant(a: string, b: string) {
    return DateTime.fromISO(a).toMillis() === DateTime.fromISO(b).toMillis();
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
