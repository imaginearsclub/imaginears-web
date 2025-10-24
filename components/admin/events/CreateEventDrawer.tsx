"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MarkdownEditor from "@/components/common/MarkdownEditor";
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

    const inputClass = cn(
        "mt-1 w-full rounded-2xl px-4 py-3",
        "border border-slate-300 dark:border-slate-700",
        "bg-white dark:bg-slate-800",
        "text-slate-900 dark:text-white",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                        <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                            Create Event
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="btn btn-icon btn-ghost" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleCreate} className="flex-1 overflow-auto p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    World *
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={world}
                                    onChange={(e) => setWorld(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Start *
                                </label>
                                <input
                                    type="datetime-local"
                                    className={inputClass}
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    End *
                                </label>
                                <input
                                    type="datetime-local"
                                    className={inputClass}
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Category
                            </label>
                            <select
                                className={inputClass}
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
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Short Description
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                value={shortDesc}
                                onChange={(e) => setShortDesc(e.target.value)}
                                disabled={submitting}
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
                    <div className="p-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="btn btn-muted"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </Dialog.Close>
                        <button
                            type="submit"
                            onClick={handleCreate}
                            className={cn("btn btn-primary", submitting && "is-loading")}
                            disabled={submitting}
                        >
                            {submitting ? "Creating..." : "Create"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}