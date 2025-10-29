import EventsCalendarView from "@/components/admin/events/EventsCalendarView";
import type { AdminEventRow } from "@/components/admin/EventsTable";

interface EventsCalendarTabProps {
    rows: AdminEventRow[];
    onEventClick: (id: string) => void; // eslint-disable-line no-unused-vars
}

export function EventsCalendarTab({ rows, onEventClick }: EventsCalendarTabProps) {
    return (
        <EventsCalendarView
            events={rows.map(r => ({
                id: r.id,
                title: r.title,
                startAt: r.startAt,
                endAt: r.endAt,
                category: r.category,
                status: r.status as "Draft" | "Published" | "Cancelled" | "Scheduled",
                visibility: r.visibility || "PUBLIC",
                recurrenceFreq: r.recurrenceFreq || "NONE",
                byWeekdayJson: r.byWeekday || [],
                timesJson: r.times || [],
                timezone: r.timezone || null,
                recurrenceUntil: r.recurrenceUntil || null,
            }))}
            onEventClick={onEventClick}
        />
    );
}

