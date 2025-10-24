"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MarkdownEditor, Input, Separator } from "@/components/common";
import RecurrenceEditor, { type RecurrenceValue } from "./RecurrenceEditor";

export type EditableEvent = {
    id: string;
    title: string;
    world: string;
    category: "Fireworks" | "Seasonal" | "MeetAndGreet" | "Parade" | "Other";
    details?: string | null;
    shortDescription?: string | null;
    startAt: string; // ISO
    endAt: string;   // ISO
    timezone: string;
    recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
    byWeekday: ("SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA")[];
    times: string[];
    recurrenceUntil?: string | null;
};

export default function EditEventDrawer({
                                            open,
                                            event,
                                            onOpenChange,
                                            onSaved,
                                        }: {
    open: boolean;
    event: EditableEvent | null;
    onOpenChange: (v: boolean) => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState<EditableEvent | null>(event);
    const [recurrence, setRecurrence] = useState<RecurrenceValue>(() => ({
        timezone: event?.timezone || "America/New_York",
        recurrenceFreq: (event?.recurrenceFreq || "NONE") as any,
        byWeekday: (event?.byWeekday || []) as any,
        times: event?.times || [],
        recurrenceUntil: event?.recurrenceUntil ?? null,
    }));

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && event) {
            setForm(event);
            setRecurrence({
                timezone: event.timezone,
                recurrenceFreq: event.recurrenceFreq as any,
                byWeekday: event.byWeekday as any,
                times: event.times || [],
                recurrenceUntil: event.recurrenceUntil ?? null,
            });
            setSubmitting(false);
        }
    }, [open, event]);

    async function save(e?: React.FormEvent) {
        e?.preventDefault();
        
        if (!form) return;

        // Validation
        if (!form.title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!form.world.trim()) {
            toast.error("World is required");
            return;
        }

        setSubmitting(true);

        const savePromise = (async () => {
            const res = await fetch(`/api/events/${form.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    world: form.world,
                    category: form.category,
                    details: form.details || "",
                    shortDescription: form.shortDescription || "",
                    startAt: form.startAt,
                    endAt: form.endAt,
                    timezone: recurrence.timezone,
                    recurrenceFreq: recurrence.recurrenceFreq,
                    byWeekday: recurrence.byWeekday,
                    times: recurrence.times,
                    recurrenceUntil: recurrence.recurrenceUntil ? new Date(recurrence.recurrenceUntil).toISOString() : null,
                }),
            });
            
            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: "Failed to save event" }));
                throw new Error(error.error || "Failed to save event");
            }
            
            return await res.json();
        })();

        toast.promise(savePromise, {
            loading: "Saving event...",
            success: () => {
                onOpenChange(false);
                onSaved();
                return "Event saved successfully!";
            },
            error: (err) => err.message || "Failed to save event",
        });

        try {
            await savePromise;
        } finally {
            setSubmitting(false);
        }
    }

    if (!form) return null;

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
                            Edit Event
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
                    <form onSubmit={save} className="flex-1 overflow-auto p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                    Title *
                                </label>
                                <Input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                                    value={form.world}
                                    onChange={(e) => setForm({ ...form, world: e.target.value })}
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
                                    value={form.startAt}
                                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
                                    End *
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={form.endAt}
                                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
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
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
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
                                value={form.shortDescription || ""}
                                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                                disabled={submitting}
                                placeholder="Brief description"
                            />
                        </div>

                        <div>
                            <MarkdownEditor
                                value={form.details || ""}
                                onChange={(val) => setForm({ ...form, details: val })}
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
                                onClick={save}
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
                                {submitting ? "Saving..." : "Save Event"}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
