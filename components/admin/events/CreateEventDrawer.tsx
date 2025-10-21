"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import MarkdownEditor from "@/components/common/MarkdownEditor";
import RecurrenceEditor, { RecurrenceValue } from "./RecurrenceEditor";

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
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onOpenChange(false); }
        if (open) document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [open, onOpenChange]);

    if (!open) return null;

    async function handleCreate(e?: React.FormEvent) {
        e?.preventDefault();

        if (!title.trim()) return setErr("Title is required.");
        if (!world.trim()) return setErr("World is required.");
        if (!startAt || !endAt) return setErr("Start and end are required.");

        setErr(null);
        setSubmitting(true);
        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    world,
                    category,
                    details,
                    shortDescription: shortDesc,
                    startAt, // "YYYY-MM-DDTHH:mm" from datetime-local (treated as local)
                    endAt,
                    status: "Published",
                    timezone: recurrence.timezone,
                    recurrenceFreq: recurrence.recurrenceFreq,
                    byWeekday: recurrence.byWeekday,
                    times: recurrence.times,
                    recurrenceUntil: recurrence.recurrenceUntil || null,
                }),
            });
            if (!res.ok) throw new Error("Failed to create event");
            onOpenChange(false);
            onCreated();
        } catch (ex: any) {
            setErr(ex?.message || "Failed to create event");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            <button className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} aria-label="Close backdrop" />
            <aside className="relative ml-auto h-full w-full max-w-2xl bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold">Create Event</h2>
                    <button className="btn btn-icon btn-ghost" onClick={() => onOpenChange(false)} aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="flex-1 overflow-auto p-4 space-y-4">
                    {err && <div className="rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{err}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <input className="mt-1 w-full rounded-2xl border px-4 py-3" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">World *</label>
                            <input className="mt-1 w-full rounded-2xl border px-4 py-3" value={world} onChange={(e) => setWorld(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium">Start *</label>
                            <input type="datetime-local" className="mt-1 w-full rounded-2xl border px-4 py-3" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">End *</label>
                            <input type="datetime-local" className="mt-1 w-full rounded-2xl border px-4 py-3" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <select className="mt-1 w-full rounded-2xl border px-4 py-3" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                            <option value="Fireworks">Fireworks</option>
                            <option value="Seasonal">Seasonal</option>
                            <option value="MeetAndGreet">Meet & Greet</option>
                            <option value="Parade">Parade</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Short Description</label>
                        <input className="mt-1 w-full rounded-2xl border px-4 py-3" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
                    </div>

                    <div>
                        <MarkdownEditor value={details} onChange={setDetails} label="Details (Markdown)" rows={12} />
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
                    <button type="submit" formAction="" onClick={handleCreate} className={`btn btn-primary ${submitting ? "is-loading" : ""}`} disabled={submitting}>
                        Create
                    </button>
                </div>
            </aside>
        </div>
    );
}
