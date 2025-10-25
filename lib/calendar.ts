/**
 * Calendar Utility - Generate .ics files for events
 * 
 * Allows guests to add events to their calendar apps (Google Calendar, Outlook, Apple Calendar, etc.)
 */

type CalendarEvent = {
    title: string;
    description?: string | undefined;
    location?: string | undefined;
    startTime: Date;
    endTime: Date;
    url?: string | undefined;
};

/**
 * Security: Escape special characters for iCalendar format
 * Prevents injection attacks and ensures valid .ics file
 */
function escapeICSText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Format date for iCalendar (UTC)
 * Format: YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique ID for the event
 */
function generateEventUID(eventId: string, startTime: Date): string {
    const timestamp = startTime.getTime();
    return `${eventId}-${timestamp}@imaginears.club`;
}

/**
 * Generate .ics file content for a single event
 * 
 * @param event - Event details
 * @returns iCalendar format string
 */
export function generateICS(event: CalendarEvent): string {
    const now = new Date();
    const uid = generateEventUID(event.title, event.startTime);
    
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Imaginears Club//Event Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(event.startTime)}`,
        `DTEND:${formatICSDate(event.endTime)}`,
        `SUMMARY:${escapeICSText(event.title)}`,
    ];
    
    if (event.description) {
        lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
    }
    
    if (event.location) {
        lines.push(`LOCATION:${escapeICSText(event.location)}`);
    }
    
    if (event.url) {
        lines.push(`URL:${event.url}`);
    }
    
    lines.push(
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    );
    
    return lines.join('\r\n');
}

/**
 * Create a downloadable .ics file
 * 
 * @param event - Event details
 * @returns Blob object for download
 */
export function createICSFile(event: CalendarEvent): Blob {
    const icsContent = generateICS(event);
    return new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
}

/**
 * Trigger download of .ics file
 * 
 * @param event - Event details
 * @param filename - Optional filename (defaults to event-title.ics)
 */
export function downloadICS(event: CalendarEvent, filename?: string): void {
    const blob = createICSFile(event);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Security: Sanitize filename
    const safeFilename = filename || 
        `${event.title.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.ics`;
    
    link.href = url;
    link.download = safeFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL
 * Provides direct link to add event to Google Calendar
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatICSDate(event.startTime)}/${formatICSDate(event.endTime)}`,
    });
    
    if (event.description) {
        params.append('details', event.description);
    }
    
    if (event.location) {
        params.append('location', event.location);
    }
    
    if (event.url) {
        params.append('sprop', `website:${event.url}`);
    }
    
    return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Outlook/Office 365 Calendar URL
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
    const baseUrl = 'https://outlook.office.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: event.title,
        startdt: event.startTime.toISOString(),
        enddt: event.endTime.toISOString(),
    });
    
    if (event.description) {
        params.append('body', event.description);
    }
    
    if (event.location) {
        params.append('location', event.location);
    }
    
    return `${baseUrl}?${params.toString()}`;
}

