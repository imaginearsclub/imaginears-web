"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MarkdownToolbar from "@/components/admin/events/MarkdownToolbar";

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

    // Hydrate form when opening or app changes
    useEffect(() => {
        if (open) {
            setSubmitting(false);
            setForm(initial);
        }
    }, [open, initial]);

    async function handleSave(e?: React.FormEvent) {
        e?.preventDefault();
        
        if (!form) return;

        // Validation
        if (!form.name.trim()) {
            toast.error("Name is required");
            return;
        }
        if (!form.email.trim()) {
            toast.error("Email is required");
            return;
        }

        setSubmitting(true);

        const savePromise = (async () => {
            await onSave({
                ...form,
                name: form.name.trim(),
                email: form.email.trim(),
                notes: (form.notes ?? "").trim(),
            });
        })();

        toast.promise(savePromise, {
            loading: "Saving application...",
            success: () => {
                onOpenChange(false);
                return "Application saved successfully!";
            },
            error: (err) => err?.message || "Failed to save application",
        });

        try {
            await savePromise;
        } finally {
            setSubmitting(false);
        }
    }

    const inputClass = cn(
        "mt-1 w-full rounded-2xl px-4 py-3",
        "border border-slate-300 dark:border-slate-700",
        "bg-white dark:bg-slate-900",
        "text-slate-900 dark:text-slate-100",
        "outline-none focus:ring-2 focus:ring-brandStart/50"
    );

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
                <Dialog.Content
                    className={cn(
                        "fixed right-0 top-0 bottom-0 z-50",
                        "h-full w-full max-w-lg",
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
                            Edit Application
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button type="button" className="btn btn-icon btn-ghost" aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Form */}
                    <form className="flex-1 overflow-auto p-4 space-y-4" onSubmit={handleSave}>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={form?.name ?? ""}
                                onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                                className={inputClass}
                                placeholder="Applicant name"
                                disabled={submitting}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={form?.email ?? ""}
                                onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
                                className={inputClass}
                                placeholder="name@example.com"
                                disabled={submitting}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Role
                                </label>
                                <select
                                    value={form?.role ?? "Developer"}
                                    onChange={(e) =>
                                        setForm((f) => (f ? { ...f, role: e.target.value as EditableApplication["role"] } : f))
                                    }
                                    className={inputClass}
                                    disabled={submitting}
                                >
                                    {ROLES.map((r) => (
                                        <option key={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Status
                                </label>
                                <select
                                    value={form?.status ?? "New"}
                                    onChange={(e) =>
                                        setForm((f) => (f ? { ...f, status: e.target.value as EditableApplication["status"] } : f))
                                    }
                                    className={inputClass}
                                    disabled={submitting}
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Notes
                            </label>
                            <MarkdownToolbar targetId="app-notes-md" />
                            <textarea
                                id="app-notes-md"
                                value={form?.notes ?? ""}
                                onChange={(e) => setForm((f) => (f ? { ...f, notes: e.target.value } : f))}
                                rows={6}
                                className={inputClass}
                                placeholder="Internal notes (Markdown supported)"
                                disabled={submitting}
                            />
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
                            onClick={handleSave}
                            className={cn("btn btn-primary", submitting && "is-loading")}
                            disabled={submitting || !form}
                        >
                            {submitting ? "Saving..." : "Save"}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
