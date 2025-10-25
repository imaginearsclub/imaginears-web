"use client";
import Link from "next/link";
import { memo } from "react";
import ScheduleSummary, { type Weekday, type RecurrenceFreq } from "@/components/events/ScheduleSummary";
import { Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";
import ShareButton from "@/components/events/ShareButton";
import CountdownBadge from "@/components/events/CountdownBadge";
import FavoriteButton from "@/components/events/FavoriteButton";

// Security: Define allowed string lengths to prevent abuse
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_LENGTH = 50;

type EventCardProps = {
    id: string;
    title: string;
    categoryName: string;
    recurrenceFreq: RecurrenceFreq;
    byWeekday: Weekday[];
    times: string[];
    timezone: string;
    until: Date | null;
    shortDescription: string | null;
    startAt: Date;
    endAt: Date;
    world?: string;
};

/**
 * Security: Sanitize and truncate text to prevent XSS and overflow
 */
function sanitizeText(text: string | null, maxLength: number): string {
    if (!text) return "";
    // Remove any potential HTML/script tags and truncate
    return text
        .replace(/[<>]/g, '')
        .slice(0, maxLength)
        .trim();
}

/**
 * Performance: Memoized event card component to prevent unnecessary re-renders
 * Security: Sanitizes all user-provided text content
 */
const EventCard = memo(function EventCard({
    id,
    title,
    categoryName,
    recurrenceFreq,
    byWeekday,
    times,
    timezone,
    until,
    shortDescription,
    startAt,
    endAt,
    world,
}: EventCardProps) {
    // Security: Sanitize all text inputs
    const safeTitle = sanitizeText(title, MAX_TITLE_LENGTH);
    const safeCategory = sanitizeText(categoryName, MAX_CATEGORY_LENGTH);
    const safeDescription = sanitizeText(shortDescription, MAX_DESCRIPTION_LENGTH);

    // Security: Validate ID format (should be UUID or numeric)
    const safeId = id.replace(/[^a-zA-Z0-9-_]/g, '');

    return (
        <article
            className={cn(
                "group relative rounded-2xl border-2 p-6 shadow-md transition-all duration-300",
                "bg-white dark:bg-slate-900",
                "border-slate-300 dark:border-slate-700",
                "hover:shadow-2xl hover:-translate-y-1.5",
                "hover:border-slate-400 dark:hover:border-slate-600"
            )}
        >
            {/* Countdown badge */}
            <div className="mb-3">
                <CountdownBadge startAt={startAt} endAt={endAt} size="sm" showIcon />
            </div>

            {/* Header with title and category badge */}
            <header className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug flex-1 min-w-0">
                    <Link 
                        href={`/events/${safeId}`} 
                        className={cn(
                            "line-clamp-2 transition-colors",
                            "hover:text-blue-600 dark:hover:text-blue-400"
                        )}
                        aria-label={`View details for ${safeTitle}`}
                    >
                        {safeTitle}
                    </Link>
                </h3>
                
                <div className="flex items-center gap-2 shrink-0">
                    <FavoriteButton 
                        eventId={safeId} 
                        eventTitle={safeTitle}
                        size="sm"
                        variant="ghost"
                    />
                    <Badge 
                        variant="primary" 
                        size="sm"
                        aria-label={`Event category: ${safeCategory}`}
                    >
                        {safeCategory}
                    </Badge>
                </div>
            </header>

            {/* Schedule information */}
            <div className="mb-4">
                <ScheduleSummary
                    recurrenceFreq={recurrenceFreq}
                    byWeekday={byWeekday}
                    times={times}
                    timezone={timezone}
                    until={until}
                    className="text-sm font-medium"
                />
            </div>

            {/* Description */}
            {safeDescription && (
                <p className={cn(
                    "text-sm line-clamp-3 leading-relaxed mb-4",
                    "text-slate-600 dark:text-slate-400"
                )}>
                    {safeDescription}
                </p>
            )}

            {/* Call-to-action footer */}
            <footer className={cn(
                "mt-auto pt-4 border-t space-y-3",
                "border-slate-200 dark:border-slate-800"
            )}>
                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <AddToCalendarButton
                        event={{
                            id: safeId,
                            title: safeTitle,
                            ...(safeDescription && { description: safeDescription }),
                            location: world ? `${world} @ Imaginears Club` : "Imaginears Club",
                            startTime: startAt,
                            endTime: endAt,
                        }}
                        size="sm"
                        variant="default"
                    />
                    <ShareButton
                        title={safeTitle}
                        {...(safeDescription && { description: safeDescription })}
                        size="sm"
                        variant="outline"
                    />
                </div>
                
                {/* View details link */}
                <Link
                    href={`/events/${safeId}`}
                    className={cn(
                        "group/link inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
                        "text-blue-600 dark:text-blue-400",
                        "hover:text-blue-700 dark:hover:text-blue-300"
                    )}
                    aria-label={`View full details for ${safeTitle}`}
                >
                    View details
                    <ArrowRight 
                        className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" 
                        aria-hidden="true" 
                    />
                </Link>
            </footer>

            {/* Hover effect overlay */}
            <div 
                className={cn(
                    "absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300",
                    "bg-gradient-to-br from-blue-500/0 to-indigo-500/0",
                    "group-hover:from-blue-500/[0.03] group-hover:to-indigo-500/[0.03]"
                )}
                aria-hidden="true" 
            />
        </article>
    );
});

export default EventCard;

