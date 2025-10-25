/**
 * Event countdown utilities
 * Calculates time until/since events and formats them for display
 */

export type EventStatus = 
    | "upcoming"      // Event starts in more than 1 hour
    | "starting-soon" // Event starts in less than 1 hour
    | "happening-now" // Event is currently happening
    | "ended";        // Event has ended

export type CountdownInfo = {
    status: EventStatus;
    label: string;
    timeUntil: number; // milliseconds until/since event
};

/**
 * Calculate countdown info for an event
 * @param startAt Event start time
 * @param endAt Event end time
 * @param now Current time (defaults to Date.now())
 * @returns Countdown information with status and label
 */
export function getCountdownInfo(
    startAt: Date,
    endAt: Date,
    now: number = Date.now()
): CountdownInfo {
    const startTime = new Date(startAt).getTime();
    const endTime = new Date(endAt).getTime();
    
    // Validate dates
    if (isNaN(startTime) || isNaN(endTime)) {
        return {
            status: "upcoming",
            label: "Upcoming",
            timeUntil: Infinity,
        };
    }
    
    const msUntilStart = startTime - now;
    const msUntilEnd = endTime - now;
    
    // Event has ended
    if (msUntilEnd < 0) {
        return {
            status: "ended",
            label: "Ended",
            timeUntil: msUntilEnd,
        };
    }
    
    // Event is happening now
    if (msUntilStart <= 0 && msUntilEnd > 0) {
        const msRemaining = msUntilEnd;
        return {
            status: "happening-now",
            label: `Happening now! ${formatTimeRemaining(msRemaining)} left`,
            timeUntil: msUntilStart,
        };
    }
    
    // Event starts in less than 1 hour (starting soon)
    if (msUntilStart > 0 && msUntilStart <= 60 * 60 * 1000) {
        return {
            status: "starting-soon",
            label: `Starts ${formatTimeUntil(msUntilStart)}`,
            timeUntil: msUntilStart,
        };
    }
    
    // Event is upcoming (more than 1 hour away)
    return {
        status: "upcoming",
        label: `Starts ${formatTimeUntil(msUntilStart)}`,
        timeUntil: msUntilStart,
    };
}

/**
 * Format milliseconds until event in human-readable format
 * Examples: "in 5 minutes", "in 2 hours", "in 3 days"
 */
function formatTimeUntil(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
    
    if (hours > 0) {
        return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    if (minutes > 0) {
        return `in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return 'in less than a minute';
}

/**
 * Format milliseconds remaining in human-readable format
 * Examples: "5 minutes", "2 hours", "3 days"
 */
function formatTimeRemaining(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    
    if (hours > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return 'less than a minute';
}

/**
 * Get the variant (color scheme) based on event status
 */
export function getCountdownVariant(status: EventStatus): "default" | "warning" | "success" | "info" {
    switch (status) {
        case "happening-now":
            return "success";
        case "starting-soon":
            return "warning";
        case "ended":
            return "info";
        case "upcoming":
        default:
            return "default";
    }
}

