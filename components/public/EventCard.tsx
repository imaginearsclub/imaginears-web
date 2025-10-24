"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ScheduleSummary, { type Weekday, type RecurrenceFreq } from "@/components/events/ScheduleSummary";

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
};

export default function EventCard({
    id,
    title,
    categoryName,
    recurrenceFreq,
    byWeekday,
    times,
    timezone,
    until,
    shortDescription,
}: EventCardProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains("dark");
            setIsDarkMode(isDark);
        };

        checkTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && 
                    (mutation.attributeName === "class" || mutation.attributeName === "data-theme")) {
                    checkTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"]
        });

        return () => observer.disconnect();
    }, []);

    return (
        <article
            className="group relative rounded-2xl border p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5"
            style={{
                backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : '#ffffff',
                borderColor: isDarkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(203, 213, 225, 0.8)',
            }}
        >
            {/* Category badge with color coding */}
            <header className="flex items-start justify-between gap-3 mb-4">
                <h3 
                    className="text-lg font-bold leading-snug flex-1 min-w-0"
                    style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }}
                >
                    <Link 
                        href={`/events/${id}`} 
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                        aria-label={`View details for ${title}`}
                    >
                        {title}
                    </Link>
                </h3>
                <span 
                    className="text-xs font-semibold rounded-full border px-3 py-1.5 shrink-0"
                    style={{
                        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                        color: isDarkMode ? '#a5b4fc' : '#4f46e5',
                        borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                    }}
                    aria-label={`Event category: ${categoryName}`}
                >
                    {categoryName}
                </span>
            </header>

            {/* Schedule information with improved spacing */}
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

            {/* Description with improved typography */}
            {shortDescription && (
                <p 
                    className="text-sm line-clamp-3 leading-relaxed mb-4"
                    style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}
                >
                    {shortDescription}
                </p>
            )}

            {/* Call-to-action with improved hover state */}
            <footer 
                className="mt-auto pt-4 border-t"
                style={{ borderColor: isDarkMode ? 'rgba(100, 116, 139, 0.4)' : 'rgba(226, 232, 240, 0.8)' }}
            >
                <Link
                    href={`/events/${id}`}
                    className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    aria-label={`View full details for ${title}`}
                >
                    View details
                    <span className="group-hover/link:translate-x-0.5 transition-transform" aria-hidden="true">→</span>
                </Link>
            </footer>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/[0.03] group-hover:to-indigo-500/[0.03] transition-all duration-300 pointer-events-none" aria-hidden="true" />
        </article>
    );
}

