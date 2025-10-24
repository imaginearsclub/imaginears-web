"use client";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MarkdownEditor from "@/components/common/MarkdownEditor";
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
                            Edit Event
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="btn btn-icon btn-ghost" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Form */}
                    <form onSubmit={save} className="flex-1 overflow-auto p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                                    value={form.world}
                                    onChange={(e) => setForm({ ...form, world: e.target.value })}
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
                                    value={form.startAt}
                                    onChange={(e) => setForm({ ...form, startAt: e.target.value })}
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
                                    value={form.endAt}
                                    onChange={(e) => setForm({ ...form, endAt: e.target.value })}
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
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Short Description
                            </label>
                            <input
                                type="text"
                                className={inputClass}
                                value={form.shortDescription || ""}
                                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                                disabled={submitting}
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
                            onClick={save}
                            className={cn("btn btn-primary", submitting && "is-loading")}
                            disabled={submitting}
                        >
                            {submitting ? "Saving..." : "Save"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
