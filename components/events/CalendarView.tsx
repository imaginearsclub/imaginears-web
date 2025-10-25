"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { expandEventOccurrences } from "@/lib/recurrence";
import { startOfMonth, endOfMonth } from "date-fns";

type EventItem = {
    id: string;
    title: string;
    startAt: string | Date;
    endAt: string | Date;
    category: string;
    recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
    byWeekdayJson: unknown;
    timesJson: unknown;
    timezone: string | null;
    recurrenceUntil: string | null;
};

interface CalendarViewProps {
    events: EventItem[];
    className?: string;
}

export default function CalendarView({ events, className }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Navigate to previous month
    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Navigate to next month
    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Go to today
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get days in month and organize events by date
    const { daysInMonth, eventsByDate } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
        
        // Create array of days with leading empty slots
        const days: (number | null)[] = [];
        
        // Add empty slots for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        
        // Organize events by date - expand recurring events for this month
        const eventsByDate = new Map<string, EventItem[]>();
        const monthStart = startOfMonth(firstDay);
        const monthEnd = endOfMonth(lastDay);
        
        events.forEach(event => {
            // Convert event to format expected by expandEventOccurrences
            const eventWithDates = {
                ...event,
                startAt: new Date(event.startAt),
                endAt: new Date(event.endAt),
                recurrenceUntil: event.recurrenceUntil ? new Date(event.recurrenceUntil) : null,
            };
            
            // Expand event occurrences for the current month
            const occurrences = expandEventOccurrences(
                eventWithDates as any,
                monthStart,
                monthEnd,
                100 // Max occurrences per event
            );
            
            // Add each occurrence to the calendar
            occurrences.forEach(occurrence => {
                const occurrenceDate = occurrence.start;
                
                // Only include if in current month (should always be true, but double-check)
                if (occurrenceDate.getMonth() === month && occurrenceDate.getFullYear() === year) {
                    const dateKey = `${year}-${month}-${occurrenceDate.getDate()}`;
                    const existing = eventsByDate.get(dateKey) || [];
                    // Store the original event, not the occurrence
                    if (!existing.some(e => e.id === event.id)) {
                        eventsByDate.set(dateKey, [...existing, event]);
                    }
                }
            });
        });
        
        return { daysInMonth: days, eventsByDate };
    }, [currentDate, events]);

    const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && 
                          today.getFullYear() === currentDate.getFullYear();

    return (
        <div className={cn(
            "rounded-2xl border-2 p-6 shadow-sm",
            "border-slate-300 dark:border-slate-700",
            "bg-white dark:bg-slate-900",
            className
        )}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" aria-hidden="true" />
                    {monthName}
                </h3>
                
                <div className="flex items-center gap-2">
                    {!isCurrentMonth && (
                        <button
                            onClick={goToToday}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                                "hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            )}
                        >
                            Today
                        </button>
                    )}
                    
                    <button
                        onClick={previousMonth}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            "hover:bg-slate-100 dark:hover:bg-slate-800",
                            "text-slate-700 dark:text-slate-300"
                        )}
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={nextMonth}
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            "hover:bg-slate-100 dark:hover:bg-slate-800",
                            "text-slate-700 dark:text-slate-300"
                        )}
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const isToday = isCurrentMonth && day === today.getDate();
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={day}
                            className={cn(
                                "aspect-square rounded-lg p-2 transition-all duration-200 relative",
                                "border-2",
                                isToday
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : hasEvents
                                    ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <div className="flex flex-col h-full">
                                <span className={cn(
                                    "text-sm font-semibold mb-1",
                                    isToday
                                        ? "text-blue-700 dark:text-blue-300"
                                        : "text-slate-900 dark:text-white"
                                )}>
                                    {day}
                                </span>
                                
                                {hasEvents && (
                                    <div className="flex-1 min-h-0">
                                        <div className="flex flex-wrap gap-1">
                                            {dayEvents.slice(0, 2).map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`/events/${event.id}`}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full transition-transform hover:scale-150",
                                                        "bg-purple-500 dark:bg-purple-400"
                                                    )}
                                                    title={event.title}
                                                    aria-label={event.title}
                                                />
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                                                    +{dayEvents.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span>Events scheduled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20" />
                        <span>Today</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

