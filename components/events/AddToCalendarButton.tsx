"use client";

import { useState, memo } from "react";
import { Calendar, Plus, Download, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { downloadICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from "@/lib/calendar";
import { toast } from "sonner";

type AddToCalendarButtonProps = {
    event: {
        id: string;
        title: string;
        description?: string;
        location?: string;
        startTime: Date;
        endTime: Date;
        url?: string;
    };
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline";
    className?: string;
};

/**
 * Add to Calendar Button Component
 * 
 * Provides multiple options for adding events to calendar:
 * - Download .ics file (works with all calendar apps)
 * - Google Calendar (web link)
 * - Outlook/Office 365 (web link)
 * 
 * Security: All event data is sanitized in lib/calendar.ts
 * Performance: Memoized to prevent unnecessary re-renders
 */
const AddToCalendarButton = memo(function AddToCalendarButton({
    event,
    size = "md",
    variant = "default",
    className
}: AddToCalendarButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState(false);

    const handleDownloadICS = () => {
        try {
            downloadICS({
                title: event.title,
                description: event.description,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                url: event.url,
            });
            
            toast.success("Calendar file downloaded!");
            setRecentlyAdded(true);
            setTimeout(() => setRecentlyAdded(false), 3000);
            setIsOpen(false);
        } catch (error) {
            console.error("[AddToCalendar] Failed to download ICS:", error);
            toast.error("Failed to download calendar file");
        }
    };

    const handleGoogleCalendar = () => {
        try {
            const url = getGoogleCalendarUrl({
                title: event.title,
                description: event.description,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                url: event.url,
            });
            
            window.open(url, '_blank', 'noopener,noreferrer');
            toast.success("Opening Google Calendar...");
            setRecentlyAdded(true);
            setTimeout(() => setRecentlyAdded(false), 3000);
            setIsOpen(false);
        } catch (error) {
            console.error("[AddToCalendar] Failed to open Google Calendar:", error);
            toast.error("Failed to open Google Calendar");
        }
    };

    const handleOutlookCalendar = () => {
        try {
            const url = getOutlookCalendarUrl({
                title: event.title,
                description: event.description,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                url: event.url,
            });
            
            window.open(url, '_blank', 'noopener,noreferrer');
            toast.success("Opening Outlook Calendar...");
            setRecentlyAdded(true);
            setTimeout(() => setRecentlyAdded(false), 3000);
            setIsOpen(false);
        } catch (error) {
            console.error("[AddToCalendar] Failed to open Outlook Calendar:", error);
            toast.error("Failed to open Outlook Calendar");
        }
    };

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const variantClasses = {
        default: cn(
            "bg-blue-600 dark:bg-blue-500",
            "hover:bg-blue-700 dark:hover:bg-blue-600",
            "text-white border-2 border-transparent"
        ),
        outline: cn(
            "bg-white dark:bg-slate-900",
            "text-blue-600 dark:text-blue-400",
            "border-2 border-blue-600 dark:border-blue-400",
            "hover:bg-blue-50 dark:hover:bg-slate-800"
        )
    };

    const buttonClass = cn(
        "inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-200",
        "shadow-md hover:shadow-xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
        sizeClasses[size],
        variantClasses[variant],
        recentlyAdded && "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 border-transparent",
        className
    );

    return (
        <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenu.Trigger asChild>
                <button
                    className={buttonClass}
                    aria-label="Add event to calendar"
                >
                    {recentlyAdded ? (
                        <>
                            <Check className="w-4 h-4" aria-hidden="true" />
                            <span>Added!</span>
                        </>
                    ) : (
                        <>
                            <Calendar className="w-4 h-4" aria-hidden="true" />
                            <span>Add to Calendar</span>
                            <Plus className="w-3 h-3 opacity-70" aria-hidden="true" />
                        </>
                    )}
                </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className={cn(
                        "z-50 overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700",
                        "bg-white dark:bg-slate-900 shadow-2xl",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[side=bottom]:slide-in-from-top-2"
                    )}
                >
                    <div className="w-64">
                        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Add to Calendar
                            </p>
                        </div>
                        
                        <div className="p-2 space-y-1">
                            {/* Download .ics file */}
                            <button
                                onClick={handleDownloadICS}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    "text-left text-sm font-medium",
                                    "text-slate-700 dark:text-slate-300",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    "focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                                )}
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold">Download (.ics)</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Works with all calendar apps
                                    </div>
                                </div>
                            </button>

                            {/* Google Calendar */}
                            <button
                                onClick={handleGoogleCalendar}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    "text-left text-sm font-medium",
                                    "text-slate-700 dark:text-slate-300",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    "focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                                )}
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <ExternalLink className="w-4 h-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold">Google Calendar</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Opens in new tab
                                    </div>
                                </div>
                            </button>

                            {/* Outlook Calendar */}
                            <button
                                onClick={handleOutlookCalendar}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    "text-left text-sm font-medium",
                                    "text-slate-700 dark:text-slate-300",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    "focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
                                )}
                            >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                    <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold">Outlook Calendar</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Opens in new tab
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Time shown in event's timezone
                            </p>
                        </div>
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
});

AddToCalendarButton.displayName = 'AddToCalendarButton';

export default AddToCalendarButton;

