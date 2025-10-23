"use client";

import { useDeferredValue, useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
import Link from "next/link";
import { formatInZone, SITE_TZ, isSameInstant } from "@/app/utils/timezone";

type EventItem = {
    id: string;
    title: string;
    world: string;
    startAt: string;    // ISO string from API/Prisma serialization
    endAt: string;      // ISO
    status: "Draft" | "Scheduled" | "Published" | "Archived";
    category: "Fireworks" | "SeasonalOverlay" | "MeetAndGreet" | "Parade" | "Other";
    shortDescription?: string | null;
};

const CATEGORY_LABEL: Record<EventItem["category"], string> = {
    Fireworks: "Fireworks",
    SeasonalOverlay: "Seasonal Overlay",
    MeetAndGreet: "Meet & Greet",
    Parade: "Parade",
    Other: "Other",
} as const;

// Security: Max search query length to prevent DOS
const MAX_SEARCH_LENGTH = 100;

// Security: Sanitize search input to prevent XSS
function sanitizeSearchInput(input: string): string {
    return input
        .slice(0, MAX_SEARCH_LENGTH)
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim();
}

// Custom Dropdown Component for better styling
interface DropdownOption {
    value: string;
    label: string;
}

interface CustomDropdownProps {
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    ariaLabel?: string;
}

const CustomDropdown = memo(({ value, options, onChange, placeholder, ariaLabel }: CustomDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = useCallback((optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    }, [onChange]);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="appearance-none w-full sm:w-auto rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow text-left"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {selectedOption?.label || placeholder}
            </button>
            <svg 
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            
            {isOpen && (
                <div 
                    className="absolute z-50 mt-2 w-full sm:min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                    role="listbox"
                >
                    <div className="max-h-60 overflow-y-auto py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                                    option.value === value
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                                role="option"
                                aria-selected={option.value === value}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

CustomDropdown.displayName = 'CustomDropdown';

// Performance: Memoized event card component
const EventCard = memo(({ 
    event, 
    categoryLabel, 
    formattedStart, 
    formattedEnd 
}: { 
    event: EventItem; 
    categoryLabel: string;
    formattedStart: string;
    formattedEnd: string | null;
}) => (
    <article 
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
        <div className="flex items-center gap-2 text-xs mb-3">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {categoryLabel}
            </span>
            <span className="text-slate-600">{event.world}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">
            {event.title}
        </h3>
        
        <p className="text-sm text-slate-600 mt-1 line-clamp-3 leading-relaxed">
            {event.shortDescription ?? "Join us for a magical experience!"}
        </p>

        <div className="mt-3 text-xs text-slate-600 font-medium">
            {formattedStart}
            {formattedEnd && ` — ${formattedEnd}`}
            <span className="text-[10px] ml-1">({SITE_TZ})</span>
        </div>

        <Link 
            href={`/events/${event.id}`} 
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
            View details
            <span aria-hidden="true">→</span>
        </Link>
    </article>
));

EventCard.displayName = 'EventCard';

// Performance: Derive unique worlds from provided events
// Security: Validate world names
function deriveWorlds(events: EventItem[]): string[] {
    const worldSet = new Set<string>();
    for (const event of events) {
        // Security: Only add valid, non-empty world strings
        if (event.world && typeof event.world === 'string' && event.world.length > 0 && event.world.length < 50) {
            worldSet.add(event.world);
        }
    }
    return Array.from(worldSet).sort((a, b) => a.localeCompare(b));
}

export default function EventsPublicFilter({ events }: { events: EventItem[] }) {
    const [q, setQ] = useState("");
    const qDeferred = useDeferredValue(q);
    const [cat, setCat] = useState<"All" | keyof typeof CATEGORY_LABEL>("All");
    const [world, setWorld] = useState<"All" | string>("All");

    // Performance: Memoize category validation
    const CATEGORY_KEYS = useMemo(
        () => Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>, 
        []
    );
    
    const isCategory = useCallback(
        (v: string): v is keyof typeof CATEGORY_LABEL => CATEGORY_KEYS.includes(v as any),
        [CATEGORY_KEYS]
    );

    // Performance: Memoize worlds list
    const worlds = useMemo(() => deriveWorlds(events), [events]);

    // Security: Sanitize and normalize search query
    const qNorm = useMemo(() => {
        const sanitized = sanitizeSearchInput(qDeferred);
        return sanitized.toLowerCase();
    }, [qDeferred]);

    // Performance: Optimized filtering with early returns
    const filtered = useMemo(() => {
        // Fast path: no filters applied
        if (cat === "All" && world === "All" && !qNorm) {
            return events;
        }

        return events.filter(event => {
            // Performance: Check cheapest filters first (category, world)
            if (cat !== "All" && event.category !== cat) return false;
            if (world !== "All" && event.world !== world) return false;

            // Performance: Only do expensive string search if other filters pass
            if (qNorm) {
                // Security: Build searchable text safely
                const searchableText = [
                    event.title,
                    event.world,
                    CATEGORY_LABEL[event.category],
                    event.shortDescription ?? ''
                ]
                    .join(' ')
                    .toLowerCase();
                
                if (!searchableText.includes(qNorm)) return false;
            }
            
            return true;
        });
    }, [events, qNorm, cat, world]);

    // Performance: Memoize date formatting results
    const formattedEvents = useMemo(() => {
        return filtered.map(event => {
            const formattedStart = (() => {
                try {
                    return formatInZone(event.startAt, SITE_TZ);
                } catch {
                    return event.startAt;
                }
            })();

            const endSame = isSameInstant(event.startAt, event.endAt);
            const formattedEnd = endSame ? null : (() => {
                try {
                    return formatInZone(event.endAt, SITE_TZ);
                } catch {
                    return event.endAt;
                }
            })();

            return {
                event,
                formattedStart,
                formattedEnd,
                categoryLabel: CATEGORY_LABEL[event.category],
            };
        });
    }, [filtered]);

    // Performance: Memoized input handlers
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        // Security: Sanitize on input
        const value = e.target.value;
        if (value.length <= MAX_SEARCH_LENGTH) {
            setQ(value);
        }
    }, []);

    const handleCategoryChange = useCallback((value: string) => {
        // Security: Strict validation
        setCat(value === "All" ? "All" : (isCategory(value) ? value : "All"));
    }, [isCategory]);

    const handleWorldChange = useCallback((value: string) => {
        // Security: Validate world selection
        setWorld(value === "All" ? "All" : (worlds.includes(value) ? value : "All"));
    }, [worlds]);

    // Dropdown options
    const categoryOptions: DropdownOption[] = useMemo(() => [
        { value: "All", label: "All Categories" },
        { value: "Fireworks", label: "Fireworks" },
        { value: "SeasonalOverlay", label: "Seasonal Overlay" },
        { value: "MeetAndGreet", label: "Meet & Greet" },
        { value: "Parade", label: "Parade" },
        { value: "Other", label: "Other" },
    ], []);

    const worldOptions: DropdownOption[] = useMemo(() => [
        { value: "All", label: "All Worlds" },
        ...worlds.map(w => ({ value: w, label: w }))
    ], [worlds]);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="flex-1 relative">
                    <label htmlFor="event-search" className="sr-only">Search events</label>
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        id="event-search"
                        type="search"
                        value={q}
                        onChange={handleSearchChange}
                        placeholder="Search events…"
                        maxLength={MAX_SEARCH_LENGTH}
                        className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 placeholder:text-slate-400 pl-11 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow"
                        aria-label="Search events by name, world, or category"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <CustomDropdown
                        value={cat}
                        options={categoryOptions}
                        onChange={handleCategoryChange}
                        ariaLabel="Filter events by category"
                    />

                    <CustomDropdown
                        value={world}
                        options={worldOptions}
                        onChange={handleWorldChange}
                        ariaLabel="Filter events by world"
                    />
                </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-slate-600">
                Showing {formattedEvents.length} of {events.length} events
            </div>

            {/* Event Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formattedEvents.length === 0 && (
                    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                        <div className="mx-auto max-w-sm">
                            <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-slate-700 font-semibold mb-2">No events found</p>
                            <p className="text-sm text-slate-600">Try adjusting your filters to see more results.</p>
                        </div>
                    </div>
                )}

                {formattedEvents.map(({ event, formattedStart, formattedEnd, categoryLabel }) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        categoryLabel={categoryLabel}
                        formattedStart={formattedStart}
                        formattedEnd={formattedEnd}
                    />
                ))}
            </div>
        </div>
    );
}
