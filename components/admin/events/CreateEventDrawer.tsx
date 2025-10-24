"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MarkdownEditor, Input, Separator } from "@/components/common";
import RecurrenceEditor, { type RecurrenceValue } from "./RecurrenceEditor";

type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onCreated: () => void; // call to refresh
};

export default function CreateEventDrawer({ open, onOpenChange, onCreated }: Props) {
    const [title, setTitle] = useState("");
    const [world, setWorld] = useState("");
    const [category, setCategory] = useState<"Fireworks" | "Seasonal" | "MeetAndGreet" | "Parade" | "Other">("Other");
    const [details, setDetails] = useState("");
    const [shortDesc, setShortDesc] = useState("");

    // Reference start/end for duration
    const [startAt, setStartAt] = useState<string>(""); // ISO-local from <input type="datetime-local">
    const [endAt, setEndAt] = useState<string>("");

    const [recurrence, setRecurrence] = useState<RecurrenceValue>({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
        recurrenceFreq: "NONE",
        byWeekday: [],
        times: [],
        recurrenceUntil: null,
    });

    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(e?: React.FormEvent) {
        e?.preventDefault();

        // Validation
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!world.trim()) {
            toast.error("World is required");
            return;
        }
        if (!startAt || !endAt) {
            toast.error("Start and end dates are required");
            return;
        }

        setSubmitting(true);

        const createPromise = (async () => {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    world,
                    category,
                    details,
                    shortDescription: shortDesc,
                    startAt,
                    endAt,
                    status: "Published",
                    timezone: recurrence.timezone,
                    recurrenceFreq: recurrence.recurrenceFreq,
                    byWeekday: recurrence.byWeekday,
                    times: recurrence.times,
                    recurrenceUntil: recurrence.recurrenceUntil || null,
                }),
            });
            
            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: "Failed to create event" }));
                throw new Error(error.error || "Failed to create event");
            }
            
            return await res.json();
        })();

        toast.promise(createPromise, {
            loading: "Creating event...",
            success: () => {
                onOpenChange(false);
                onCreated();
                return "Event created successfully!";
            },
            error: (err) => err.message || "Failed to create event",
        });

        try {
            await createPromise;
        } finally {
            setSubmitting(false);
        }
    }

    const selectClass = cn(
        "mt-2 w-full rounded-xl border-2 px-4 py-3",
        "border-slate-300 dark:border-slate-700",
        "bg-white dark:bg-slate-900",
        "text-slate-900 dark:text-white",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        "transition-all"
    );

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <Dialog.Content
                    className={cn(
                        "fixed right-0 top-0 bottom-0 z-50",
                        "h-full w-full max-w-2xl",
                        "bg-white dark:bg-slate-900 shadow-2xl",
                        "flex flex-col",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                        "duration-300"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4">
                        <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                            Create Event
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button 
                                type="button"
                                className={cn(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                                    "text-slate-500 dark:text-slate-400",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    "transition-colors"
                                )}
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>
                    
                    <Separator />

                    {/* Form */}
                    <form onSubmit={handleCreate} className="flex-1 overflow-auto p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                    Title *
                                </label>
                                <Input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={submitting}
                                    placeholder="Event title"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                    World *
                                </label>
                                <Input
                                    type="text"
                                    value={world}
                                    onChange={(e) => setWorld(e.target.value)}
                                    disabled={submitting}
                                    placeholder="World name"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                    Start *
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                    End *
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                Category
                            </label>
                            <select
                                className={selectClass}
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                disabled={submitting}
                            >
                                <option value="Fireworks">Fireworks</option>
                                <option value="Seasonal">Seasonal</option>
                                <option value="MeetAndGreet">Meet & Greet</option>
                                <option value="Parade">Parade</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                Short Description
                            </label>
                            <Input
                                type="text"
                                value={shortDesc}
                                onChange={(e) => setShortDesc(e.target.value)}
                                disabled={submitting}
                                placeholder="Brief description"
                            />
                        </div>

                        <div>
                            <MarkdownEditor
                                value={details}
                                onChange={setDetails}
                                label="Details (Markdown)"
                                rows={12}
                            />
                        </div>

                        <div className="pt-2">
                            <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-end gap-3">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                        "bg-slate-100 dark:bg-slate-800",
                                        "text-slate-700 dark:text-slate-300",
                                        "hover:bg-slate-200 dark:hover:bg-slate-700",
                                        "border-2 border-transparent",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                onClick={handleCreate}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                    "bg-blue-600 dark:bg-blue-500",
                                    "text-white",
                                    "hover:bg-blue-700 dark:hover:bg-blue-600",
                                    "border-2 border-transparent",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                disabled={submitting}
                            >
                                {submitting ? "Creating..." : "Create Event"}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}