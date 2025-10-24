"use client";

import { useDeferredValue, useMemo, useState, useCallback, memo, useRef, useEffect } from "react";
import Link from "next/link";
import { formatInZone, SITE_TZ, isSameInstant } from "@/app/utils/timezone";
import { Input, Badge, EmptyState } from "@/components/common";
import { cn } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";

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
    formattedEnd 
}: { 
    event: EventItem; 
    categoryLabel: string;
    formattedStart: string;
    formattedEnd: string | null;
}) => (
    <article 
        className={cn(
            "rounded-2xl border-2 p-5 shadow-sm transition-all duration-200",
            "border-slate-300 dark:border-slate-700",
            "bg-white dark:bg-slate-900",
            "hover:shadow-lg hover:-translate-y-0.5",
            "hover:border-slate-400 dark:hover:border-slate-600"
        )}
    >
        <div className="flex items-center gap-2 text-xs mb-3">
            <Badge variant="primary" size="sm">
                {categoryLabel}
            </Badge>
            <Badge variant="default" size="sm">
                {event.world}
            </Badge>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
            {event.title}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
            {event.shortDescription ?? "Join us for a magical experience!"}
        </p>

        <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
            {formattedStart}
            {formattedEnd && ` — ${formattedEnd}`}
            <span className="text-[10px] ml-1">({SITE_TZ})</span>
        </div>

        <Link 
            href={`/events/${event.id}`} 
            className={cn(
                "mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-colors",
                "text-blue-600 dark:text-blue-400",
                "hover:text-blue-700 dark:hover:text-blue-300"
            )}
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
        <div className={cn(
            "rounded-2xl border-2 p-6 shadow-sm",
            "border-slate-300 dark:border-slate-700",
            "bg-white dark:bg-slate-900"
        )}>
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="flex-1 relative">
                    <label htmlFor="event-search" className="sr-only">Search events</label>
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <Input
                        id="event-search"
                        type="search"
                        value={q}
                        onChange={handleSearchChange}
                        placeholder="Search events…"
                        maxLength={MAX_SEARCH_LENGTH}
                        className="pl-11"
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
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                Showing <strong className="text-slate-900 dark:text-white">{formattedEvents.length}</strong> of <strong className="text-slate-900 dark:text-white">{events.length}</strong> events
            </div>

            {/* Event Grid */}
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
