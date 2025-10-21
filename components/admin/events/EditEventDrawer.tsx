"use client";
import MarkdownEditor from "@/components/common/MarkdownEditor";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import RecurrenceEditor, { RecurrenceValue } from "./RecurrenceEditor";

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
    const [err, setErr] = useState<string | null>(null);

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
            setErr(null);
            setSubmitting(false);
        }
    }, [open, event]);

    useEffect(() => {
        function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onOpenChange(false); }
        if (open) document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [open, onOpenChange]);

    if (!open || !form) return null;

    async function save(e?: React.FormEvent) {
        e?.preventDefault();
        if (!form.title.trim()) return setErr("Title is required.");
        if (!form.world.trim()) return setErr("World is required.");

        setSubmitting(true);
        setErr(null);
        try {
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
            if (!res.ok) throw new Error("Failed to save");
            onOpenChange(false);
            onSaved();
        } catch (ex: any) {
            setErr(ex?.message || "Failed to save");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            <button className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-label="Close backdrop" />
            <aside className="relative ml-auto h-full w-full max-w-2xl bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold">Edit Event</h2>
                    <button className="btn btn-icon btn-ghost" onClick={() => onOpenChange(false)} aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={save} className="flex-1 overflow-auto p-4 space-y-4">
                    {err && <div className="rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{err}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <input className="mt-1 w-full rounded-2xl border px-4 py-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">World *</label>
                            <input className="mt-1 w-full rounded-2xl border px-4 py-3" value={form.world} onChange={(e) => setForm({ ...form, world: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Start *</label>
                            <input type="datetime-local" className="mt-1 w-full rounded-2xl border px-4 py-3" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">End *</label>
                            <input type="datetime-local" className="mt-1 w-full rounded-2xl border px-4 py-3" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select className="mt-1 w-full rounded-2xl border px-4 py-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                            <option value="Fireworks">Fireworks</option>
                            <option value="Seasonal">Seasonal</option>
                            <option value="MeetAndGreet">Meet & Greet</option>
                            <option value="Parade">Parade</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Short Description</label>
                        <input className="mt-1 w-full rounded-2xl border px-4 py-3" value={form.shortDescription || ""} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
                    </div>

                    <div>
                        <MarkdownEditor
                            value={form.details || ""}
                            onChange={(val) => setForm({ ...form, details: val })}
                            label="Details (Markdown)"
                            rows={12}
                        />
                    </div>

                    {/* Recurrence */}
                    <div className="pt-2">
                        <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
                    </div>
                </form>

                <div className="p-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                    <button type="button" className="btn btn-muted" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </button>
                    <button type="submit" formAction="" onClick={save} className={`btn btn-primary ${submitting ? "is-loading" : ""}`} disabled={submitting}>
                        Save
                    </button>
                </div>
            </aside>
        </div>
    );
}
