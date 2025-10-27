"use client";

import { useDeferredValue, useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
import Link from "next/link";
import { formatInZone, SITE_TZ, isSameInstant } from "@/app/utils/timezone-client";
import { Input, Badge, EmptyState } from "@/components/common";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Command, Heart, Calendar, LayoutGrid } from "lucide-react";
import { getFavorites } from "@/lib/favorites";
import AddToCalendarButton from "@/components/events/AddToCalendarButton";
import ShareButton from "@/components/events/ShareButton";
import CountdownBadge from "@/components/events/CountdownBadge";
import FavoriteButton from "@/components/events/FavoriteButton";
import CalendarView from "@/components/events/CalendarView";

type EventItem = {
    id: string;
    title: string;
    world: string;
    startAt: string;    // ISO string from API/Prisma serialization
    endAt: string;      // ISO
    status: "Draft" | "Scheduled" | "Published" | "Archived";
    category: "Fireworks" | "SeasonalOverlay" | "MeetAndGreet" | "Parade" | "Other";
    shortDescription?: string | null;
    recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
    byWeekdayJson: unknown;
    timesJson: unknown;
    timezone: string | null;
    recurrenceUntil: string | null;
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
                className={cn(
                    "appearance-none w-full sm:w-auto rounded-xl border-2 font-medium pl-4 pr-10 py-2.5 outline-none text-left transition-all duration-200",
                    "bg-white dark:bg-slate-900",
                    "border-slate-300 dark:border-slate-700",
                    "text-slate-700 dark:text-slate-300",
                    "hover:bg-slate-50 dark:hover:bg-slate-800",
                    "hover:border-slate-400 dark:hover:border-slate-600",
                    "focus:ring-2 focus:ring-blue-500/50",
                    "shadow-sm hover:shadow"
                )}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                {selectedOption?.label || placeholder}
            </button>
            <ChevronDown 
                className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none transition-transform duration-200",
                    isOpen && "rotate-180"
                )}
            />
            
            {isOpen && (
                <div 
                    className={cn(
                        "absolute z-50 mt-2 w-full sm:min-w-[200px] rounded-xl overflow-hidden shadow-xl",
                        "border-2 border-slate-300 dark:border-slate-700",
                        "bg-white dark:bg-slate-900"
                    )}
                    role="listbox"
                >
                    <div className="max-h-60 overflow-y-auto py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "w-full text-left px-4 py-2.5 text-sm transition-colors duration-150",
                                    option.value === value
                                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                )}
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
    formattedEnd,
    displayTimezone
}: { 
    event: EventItem; 
    categoryLabel: string;
    formattedStart: string;
    formattedEnd: string | null;
    displayTimezone: string;
}) => {
    // Parse dates for calendar button
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);
    
    return (
        <article 
            className={cn(
                "rounded-2xl border-2 p-5 shadow-sm transition-all duration-300",
                "border-slate-300 dark:border-slate-700",
                "bg-white dark:bg-slate-900",
                "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]",
                "hover:border-blue-400 dark:hover:border-blue-600",
                "flex flex-col group"
            )}
        >
            {/* Countdown badge */}
            <div className="mb-3">
                <CountdownBadge startAt={startDate} endAt={endDate} size="sm" showIcon />
            </div>

            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Badge variant="primary" size="sm">
                        {categoryLabel}
                    </Badge>
                    <Badge variant="default" size="sm">
                        {event.world}
                    </Badge>
                </div>
                <FavoriteButton 
                    eventId={event.id} 
                    eventTitle={event.title}
                    size="sm"
                    variant="ghost"
                />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                {event.title}
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed mb-3">
                {event.shortDescription ?? "Join us for a magical experience!"}
            </p>

            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-4">
                {formattedStart}
                {formattedEnd && ` — ${formattedEnd}`}
                <span className="text-[10px] ml-1">({displayTimezone})</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-3 mt-auto">
                <AddToCalendarButton
                    event={{
                        id: event.id,
                        title: event.title,
                        ...(event.shortDescription && { description: event.shortDescription }),
                        location: `${event.world} @ Imaginears Club`,
                        startTime: startDate,
                        endTime: endDate,
                    }}
                    size="sm"
                    variant="default"
                />
                <ShareButton
                    title={event.title}
                    {...(event.shortDescription && { description: event.shortDescription })}
                    size="sm"
                    variant="outline"
                />
            </div>

            <Link 
                href={`/events/${event.id}`} 
                className={cn(
                    "inline-flex items-center gap-1 text-sm font-semibold transition-all duration-200",
                    "text-blue-600 dark:text-blue-400",
                    "hover:text-blue-700 dark:hover:text-blue-300",
                    "hover:gap-2 group-hover:underline"
                )}
            >
                View details
                <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
        </article>
    );
});

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

export default function EventsPublicFilter({ events, userTimezone }: { events: EventItem[]; userTimezone?: string }) {
    const displayTimezone = userTimezone || SITE_TZ;
    const [q, setQ] = useState("");
    const qDeferred = useDeferredValue(q);
    const [cat, setCat] = useState<"All" | keyof typeof CATEGORY_LABEL>("All");
    const [world, setWorld] = useState<"All" | string>("All");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    
    // Ref for search input (for keyboard shortcut)
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load favorites on mount and listen for changes
    useEffect(() => {
        setFavorites(getFavorites());

        const handleFavoritesChanged = () => {
            setFavorites(getFavorites());
        };

        window.addEventListener("favoritesChanged", handleFavoritesChanged);
        return () => window.removeEventListener("favoritesChanged", handleFavoritesChanged);
    }, []);

    // Keyboard shortcut: Cmd/Ctrl+K to focus search
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

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
        if (cat === "All" && world === "All" && !qNorm && !showFavoritesOnly) {
            return events;
        }

        return events.filter(event => {
            // Favorites filter
            if (showFavoritesOnly && !favorites.includes(event.id)) return false;

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
    }, [events, qNorm, cat, world, showFavoritesOnly, favorites]);

    // Performance: Memoize date formatting results
    const formattedEvents = useMemo(() => {
        return filtered.map(event => {
            const formattedStart = (() => {
                try {
                    return formatInZone(event.startAt, displayTimezone);
                } catch {
                    return event.startAt;
                }
            })();

            const endSame = isSameInstant(event.startAt, event.endAt);
            const formattedEnd = endSame ? null : (() => {
                try {
                    return formatInZone(event.endAt, displayTimezone);
                } catch {
                    return event.endAt;
                }
            })();

            return {
                event,
                formattedStart,
                formattedEnd,
                categoryLabel: CATEGORY_LABEL[event.category],
                displayTimezone,
            };
        });
    }, [filtered, displayTimezone]);

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
        <div className={cn(
            "rounded-2xl border-2 p-6 shadow-lg",
            "border-slate-300 dark:border-slate-700",
            "bg-white dark:bg-slate-900"
        )}>
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="flex-1 relative">
                    <label htmlFor="event-search" className="sr-only">Search events</label>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <Input
                        ref={searchInputRef}
                        id="event-search"
                        type="search"
                        value={q}
                        onChange={handleSearchChange}
                        placeholder="Search events…"
                        maxLength={MAX_SEARCH_LENGTH}
                        className="pl-11 pr-16"
                        aria-label="Search events by name, world, or category"
                    />
                    {/* Keyboard shortcut hint */}
                    <kbd 
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                            "hidden sm:flex items-center gap-1",
                            "px-2 py-1 text-xs font-semibold rounded-md border",
                            "bg-slate-100 dark:bg-slate-800",
                            "text-slate-600 dark:text-slate-400",
                            "border-slate-300 dark:border-slate-700",
                            "transition-opacity duration-200",
                            q ? "opacity-0" : "opacity-100"
                        )}
                        aria-hidden="true"
                    >
                        <Command className="w-3 h-3" />
                        K
                    </kbd>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={cn(
                            "appearance-none w-full sm:w-auto rounded-xl border-2 font-medium px-4 py-2.5 outline-none transition-all duration-200 flex items-center justify-center gap-2",
                            showFavoritesOnly
                                ? "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600",
                            "shadow-sm hover:shadow focus:ring-2 focus:ring-blue-500/50"
                        )}
                        aria-label="Show only favorited events"
                        aria-pressed={showFavoritesOnly}
                    >
                        <Heart className={cn(
                            "w-4 h-4",
                            showFavoritesOnly && "fill-red-500 text-red-500"
                        )} />
                        <span>Favorites ({favorites.length})</span>
                    </button>

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

            {/* Results count and view toggle */}
            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Showing <strong className="text-slate-900 dark:text-white">{formattedEvents.length}</strong> of <strong className="text-slate-900 dark:text-white">{events.length}</strong> events
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 active:scale-95",
                            viewMode === "list"
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                        aria-label="List view"
                        aria-pressed={viewMode === "list"}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={cn(
                            "px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 active:scale-95",
                            viewMode === "calendar"
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                        aria-label="Calendar view"
                        aria-pressed={viewMode === "calendar"}
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Calendar</span>
                    </button>
                </div>
            </div>

            {/* Calendar or List View */}
            {viewMode === "calendar" ? (
                <div className="mt-6">
                    <CalendarView events={filtered} />
                </div>
            ) : (
                /* Event Grid */
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {formattedEvents.length === 0 && (
                        <div className="col-span-full">
                            <EmptyState
                                icon={<Search className="w-12 h-12" />}
                                title="No events found"
                                description="Try adjusting your filters to see more results."
                            />
                        </div>
                    )}

                    {formattedEvents.map(({ event, formattedStart, formattedEnd, categoryLabel, displayTimezone }) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            categoryLabel={categoryLabel}
                            formattedStart={formattedStart}
                            formattedEnd={formattedEnd}
                            displayTimezone={displayTimezone}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
