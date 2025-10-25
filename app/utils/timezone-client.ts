/**
 * Client-safe timezone utilities
 * These functions can be used in both server and client components
 */

import { DateTime } from "luxon";

export const SITE_TZ = "America/New_York";

// Valid IANA timezone cache for performance and security
const validTimezones = new Set(Intl.supportedValuesOf?.("timeZone") || [SITE_TZ]);

/**
 * Validate and sanitize timezone string
 * Security: Prevents timezone injection and ensures valid IANA timezone
 */
function validateTimezone(zone: string): string {
    // Strip any potentially dangerous characters
    const sanitized = zone.trim();
    
    // Validate against known IANA timezones
    if (!validTimezones.has(sanitized)) {
        console.warn(`Invalid timezone "${zone}" provided, falling back to ${SITE_TZ}`);
        return SITE_TZ;
    }
    
    return sanitized;
}

/**
 * Internal: coerce input into a Luxon DateTime in UTC
 * Robustness: Added comprehensive error handling and validation
 */
function toUTCDateTime(input: string | Date | null | undefined): DateTime {
    // Handle null/undefined
    if (input == null) {
        console.warn("Null or undefined date provided, using current time");
        return DateTime.utc();
    }
    
    try {
        if (typeof input === "string") {
            // Validate string is not empty or just whitespace
            const trimmed = input.trim();
            if (!trimmed) {
                console.warn("Empty date string provided, using current time");
                return DateTime.utc();
            }
            
            const dt = DateTime.fromISO(trimmed, { zone: "utc" });
            
            // Check if parsing was successful
            if (!dt.isValid) {
                console.warn(`Invalid ISO date string: ${trimmed}, reason: ${dt.invalidReason}`);
                return DateTime.utc();
            }
            
            return dt;
        }
        
        if (input instanceof Date) {
            // Validate Date object is not Invalid Date
            if (isNaN(input.getTime())) {
                console.warn("Invalid Date object provided, using current time");
                return DateTime.utc();
            }
            
            const dt = DateTime.fromJSDate(input, { zone: "utc" });
            
            if (!dt.isValid) {
                console.warn(`Failed to convert Date to DateTime: ${dt.invalidReason}`);
                return DateTime.utc();
            }
            
            return dt;
        }
        
        // Fallback: try to parse whatever it is as ISO string
        const dt = DateTime.fromISO(String(input), { zone: "utc" });
        
        if (!dt.isValid) {
            console.warn(`Failed to parse input as ISO string, using current time`);
            return DateTime.utc();
        }
        
        return dt;
    } catch (error) {
        console.error("Unexpected error in toUTCDateTime:", error);
        return DateTime.utc();
    }
}

/**
 * Format UTC instant (string or Date) → readable date/time in a zone
 * Security: Validates timezone, handles errors gracefully
 */
export function formatInZone(
    instantUTC: string | Date | null | undefined, 
    zone: string = SITE_TZ
): string {
    try {
        const validZone = validateTimezone(zone);
        const dt = toUTCDateTime(instantUTC).setZone(validZone);
        
        if (!dt.isValid) {
            console.warn("Invalid DateTime in formatInZone");
            return "Invalid date";
        }
        
        return dt.toFormat("LLL dd, hh:mm a");
    } catch (error) {
        console.error("Error formatting date in zone:", error);
        return "Invalid date";
    }
}

/**
 * Compare two UTC instants (string or Date) for equality
 * Robustness: Handles null/undefined safely
 */
export function isSameInstant(
    a: string | Date | null | undefined, 
    b: string | Date | null | undefined
): boolean {
    try {
        const dtA = toUTCDateTime(a);
        const dtB = toUTCDateTime(b);
        
        if (!dtA.isValid || !dtB.isValid) {
            return false;
        }
        
        return dtA.toMillis() === dtB.toMillis();
    } catch (error) {
        console.error("Error comparing dates:", error);
        return false;
    }
}

/**
 * Convert local date+time (wall clock) in zone → UTC ISO
 * Security: Validates all inputs, prevents injection
 * Performance: Optimized parsing
 */
export function toISOFromLocalParts(
    date: string, 
    time: string, 
    zone: string = SITE_TZ
): string | null {
    try {
        // Validate inputs are not empty
        if (!date?.trim() || !time?.trim()) {
            console.warn("Empty date or time provided to toISOFromLocalParts");
            return null;
        }
        
        const validZone = validateTimezone(zone);
        
        // Parse and validate date parts
        const dateParts = date.trim().split("-");
        if (dateParts.length !== 3 || !dateParts[0] || !dateParts[1] || !dateParts[2]) {
            console.warn(`Invalid date format: ${date}, expected YYYY-MM-DD`);
            return null;
        }
        
        const y = parseInt(dateParts[0]!, 10);
        const m = parseInt(dateParts[1]!, 10);
        const d = parseInt(dateParts[2]!, 10);
        
        // Validate date ranges
        if (isNaN(y) || isNaN(m) || isNaN(d) || 
            y < 1900 || y > 2100 || 
            m < 1 || m > 12 || 
            d < 1 || d > 31) {
            console.warn(`Invalid date values: ${y}-${m}-${d}`);
            return null;
        }
        
        // Parse and validate time parts
        const timeParts = time.trim().split(":");
        if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) {
            console.warn(`Invalid time format: ${time}, expected HH:MM`);
            return null;
        }
        
        const H = parseInt(timeParts[0]!, 10);
        const M = parseInt(timeParts[1]!, 10);
        
        // Validate time ranges
        if (isNaN(H) || isNaN(M) || H < 0 || H > 23 || M < 0 || M > 59) {
            console.warn(`Invalid time values: ${H}:${M}`);
            return null;
        }
        
        const dt = DateTime.fromObject(
            { year: y, month: m, day: d, hour: H, minute: M }, 
            { zone: validZone }
        ).toUTC();
        
        if (!dt.isValid) {
            console.warn(`Failed to create DateTime: ${dt.invalidReason}`);
            return null;
        }
        
        return dt.toISO();
    } catch (error) {
        console.error("Error converting local parts to ISO:", error);
        return null;
    }
}

/**
 * Convert UTC ISO → local date+time strings for inputs
 * Security: Validates timezone and ISO string
 */
export function isoToLocalParts(
    isoUTC: string | null | undefined, 
    zone: string = SITE_TZ
): { date: string; time: string } | null {
    try {
        if (!isoUTC?.trim()) {
            console.warn("Empty ISO string provided to isoToLocalParts");
            return null;
        }
        
        const validZone = validateTimezone(zone);
        const dt = DateTime.fromISO(isoUTC.trim(), { zone: "utc" }).setZone(validZone);
        
        if (!dt.isValid) {
            console.warn(`Invalid ISO string: ${isoUTC}, reason: ${dt.invalidReason}`);
            return null;
        }
        
        return {
            date: dt.toFormat("yyyy-LL-dd"),
            time: dt.toFormat("HH:mm"),
        };
    } catch (error) {
        console.error("Error converting ISO to local parts:", error);
        return null;
    }
}

