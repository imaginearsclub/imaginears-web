"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import MarkdownToolbar from "@/components/admin/events/MarkdownToolbar"; // re-use the toolbar we added

export type EditableApplication = {
    id: string;
    name: string;
    email: string;
    role: "Developer" | "GuestServices" | "Imaginear";
    status: "New" | "InReview" | "Approved" | "Rejected";
    notes?: string | null;
};

type Props = {
    open: boolean;
    app?: EditableApplication | null; // pass the row to edit
    onOpenChange: (v: boolean) => void;
    onSave: (updated: EditableApplication) => Promise<void> | void; // caller updates state / API
};

const ROLES: EditableApplication["role"][] = ["Developer", "GuestServices", "Imaginear"];
const STATUSES: EditableApplication["status"][] = ["New", "InReview", "Approved", "Rejected"];

export default function EditApplicationDrawer({ open, app, onOpenChange, onSave }: Props) {
    const initial = useMemo<EditableApplication | null>(
        () =>
            app
                ? {
                    id: app.id,
                    name: app.name ?? "",
                    email: app.email ?? "",
                    role: app.role ?? "Developer",
                    status: app.status ?? "New",
                    notes: app.notes ?? "",
                }
                : null,
        [app]
    );

    const [form, setForm] = useState<EditableApplication | null>(initial);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // hydrate form when opening or app changes
    useEffect(() => {
        if (open) {
            setErr(null);
            setSubmitting(false);
            setForm(initial);
        }
    }, [open, initial]);

    // close on Esc
    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") onOpenChange(false);
        }
        if (open) document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [open, onOpenChange]);

    if (!open) return null;

    async function handleSave(e?: React.FormEvent) {
        e?.preventDefault();
        if (!form) return;
        if (!form.name.trim()) return setErr("Name is required.");
        if (!form.email.trim()) return setErr("Email is required.");

        try {
            setErr(null);
            setSubmitting(true);
            await onSave({
                ...form,
                name: form.name.trim(),
                email: form.email.trim(),
                notes: (form.notes ?? "").trim(),
            });
            onOpenChange(false);
        } catch (ex: any) {
            setErr(ex?.message || "Failed to save application");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close"
                className="absolute inset-0 bg-black/40"
                onClick={() => onOpenChange(false)}
            />
            {/* Panel */}
            <aside
                className="relative ml-auto h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Edit Application"
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Application</h2>
                    <button type="button" className="btn btn-icon btn-ghost" onClick={() => onOpenChange(false)} aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form className="flex-1 overflow-auto p-4 space-y-4" onSubmit={handleSave}>
                    {err && <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 p-3 text-sm">{err}</div>}

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                        <input
                            value={form?.name ?? ""}
                            onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                            className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-brandStart/50"
                            placeholder="Applicant name"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
                        <input
                            type="email"
                            value={form?.email ?? ""}
                            onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
                            className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-brandStart/50"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                            <select
                                value={form?.role ?? "Developer"}
                                onChange={(e) =>
                                    setForm((f) => (f ? { ...f, role: e.target.value as EditableApplication["role"] } : f))
                                }
                                className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3"
                            >
                                {ROLES.map((r) => (
                                    <option key={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                            <select
                                value={form?.status ?? "New"}
                                onChange={(e) =>
                                    setForm((f) => (f ? { ...f, status: e.target.value as EditableApplication["status"] } : f))
                                }
                                className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3"
                            >
                                {STATUSES.map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                        <MarkdownToolbar targetId="app-notes-md" />
                        <textarea
                            id="app-notes-md"
                            value={form?.notes ?? ""}
                            onChange={(e) => setForm((f) => (f ? { ...f, notes: e.target.value } : f))}
                            rows={6}
                            className="mt-1 w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-brandStart/50"
                            placeholder="Internal notes (Markdown supported)"
                        />
                    </div>
                </form>

                <div className="p-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                    <button type="button" className="btn btn-muted" onClick={() => onOpenChange(false)} disabled={submitting}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        formAction=""
                        onClick={handleSave}
                        className={`btn btn-primary ${submitting ? "is-loading" : ""}`}
                        disabled={submitting || !form}
                    >
                        Save
                    </button>
                </div>
            </aside>
        </div>
    );
}
