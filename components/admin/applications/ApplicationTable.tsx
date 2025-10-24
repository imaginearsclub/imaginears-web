"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Checkbox, Badge } from "@/components/common";

/** Keep these in sync with your Prisma enums */
export type AppRole = "Developer" | "Imaginear" | "GuestServices";
export type AppStatus = "New" | "InReview" | "Approved" | "Rejected";

export type ApplicationRow = {
    id: string;
    name: string;
    email: string;
    role: AppRole;
    status: AppStatus;
    submittedAt: string; // ISO
    notes?: string;
};

export default function ApplicationTable({
                                             rows,
                                             onEdit,
                                             onOpenNotes,
                                             onChangeStatus,
                                             onChangeRole,
                                             onDelete,
                                             onExportCSV,
                                             onBulkChangeStatus,
                                         }: {
    rows?: ApplicationRow[];
    onEdit?: (id: string) => void;
    onOpenNotes?: (id: string) => void;
    onChangeStatus?: (id: string, status: AppStatus) => void;
    onChangeRole?: (id: string, role: AppRole) => void;
    onDelete?: (id: string) => void;
    onExportCSV?: () => void;
    onBulkChangeStatus?: (ids: string[], status: AppStatus) => Promise<void> | void;
}) {
    const list = Array.isArray(rows) ? rows : [];

    const [selected, setSelected] = useState<string[]>([]);
    const allSelected = selected.length > 0 && selected.length === list.length;
    const someSelected = selected.length > 0 && selected.length < list.length;

    function toggleAll() {
        setSelected((s) => (s.length ? [] : list.map((r) => r.id)));
    }
    function toggleOne(id: string) {
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    }

    const hasBulk = selected.length > 0;

    const fmt = (iso: string) => {
        try {
            const d = new Date(iso);
            return new Intl.DateTimeFormat(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "numeric",
                minute: "2-digit",
            }).format(d);
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-3">
            {/* Bulk bar */}
            {hasBulk && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-3">
                    <div className="text-sm">
                        <strong>{selected.length}</strong> selected
                    </div>
                    <div className="flex gap-2">
                        <BulkMenu
                            onChangeStatus={async (status) => {
                                if (!onBulkChangeStatus) return;
                                await onBulkChangeStatus(selected, status);
                                setSelected([]); // clear after action
                            }}
                        />
                        {onExportCSV && (
                            <button className="btn btn-muted btn-sm" onClick={onExportCSV}>
                                Export CSV
                            </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>
                            Clear
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-[900px] w-full">
                    <thead className="text-left text-sm text-slate-600 dark:text-slate-300">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-3 py-2 w-10">
                            <label className="inline-flex items-center gap-2">
                                <Checkbox
                                    checked={someSelected ? "indeterminate" : allSelected}
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all applications"
                                />
                            </label>
                        </th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Submitted</th>
                        <th className="px-3 py-2 w-12"></th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {list.map((r) => (
                        <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="px-3 py-2">
                                <Checkbox
                                    checked={selected.includes(r.id)}
                                    onCheckedChange={() => toggleOne(r.id)}
                                    aria-label={`Select ${r.name}`}
                                />
                            </td>
                            <td className="px-3 py-2 font-medium">
                                {onEdit ? (
                                    <a
                                        className="hover:underline"
                                        href={`/admin/applications/${r.id}`}
                                        onClick={(_e) => {
                                            // if you prefer drawer-only, prevent default:
                                            // _e.preventDefault(); onEdit(r.id);
                                        }}
                                    >
                                        {r.name}
                                    </a>
                                ) : (
                                    r.name
                                )}
                            </td>
                            <td className="px-3 py-2">
                                <a className="underline" href={`mailto:${r.email}`}>
                                    {r.email}
                                </a>
                            </td>
                            <td className="px-3 py-2">
                                <RoleBadge role={r.role} />
                            </td>
                            <td className="px-3 py-2">
                                <StatusBadge status={r.status} />
                            </td>
                            <td className="px-3 py-2">{fmt(r.submittedAt)}</td>
                            <td className="px-3 py-2 text-right">
                                <RowActions
                                    row={r}
                                    {...(onEdit && { onEdit: () => onEdit(r.id) })}
                                    {...(onOpenNotes && { onOpenNotes: () => onOpenNotes(r.id) })}
                                    {...(onChangeStatus && { onChangeStatus })}
                                    {...(onChangeRole && { onChangeRole })}
                                    {...(onDelete && { onDelete: () => onDelete(r.id) })}
                                />
                            </td>
                        </tr>
                    ))}

                    {!list.length && (
                        <tr>
                            <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                                No applications found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** ===== Radix Dropdown (Portal) row actions ===== */
function RowActions({
                        row,
                        onEdit,
                        onOpenNotes,
                        onChangeStatus,
                        onChangeRole,
                        onDelete,
                    }: {
    row: ApplicationRow;
    onEdit?: () => void;
    onOpenNotes?: () => void;
    onChangeStatus?: (id: string, status: AppStatus) => void;
    onChangeRole?: (id: string, role: AppRole) => void;
    onDelete?: () => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
            <DropdownMenu.Trigger asChild>
                <button type="button" className="btn btn-ghost btn-xs" aria-label="Open row actions">
                    ⋯
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-[9999] min-w-[210px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                >
                    <DropdownMenu.Item
                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onEdit?.();
                        }}
                    >
                        Edit
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onOpenNotes?.();
                        }}
                    >
                        Notes
                    </DropdownMenu.Item>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            Change status →
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.SubContent
                                className="z-[10000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                                sideOffset={6}
                                alignOffset={-4}
                            >
                                {(["New", "InReview", "Approved", "Rejected"] as AppStatus[]).map((s) => (
                                    <DropdownMenu.Item
                                        key={s}
                                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setOpen(false);
                                            onChangeStatus?.(row.id, s);
                                        }}
                                    >
                                        {s}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            Change role →
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.SubContent
                                className="z-[10000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                                sideOffset={6}
                                alignOffset={-4}
                            >
                                {(["Developer", "Imaginear", "GuestServices"] as AppRole[]).map((r) => (
                                    <DropdownMenu.Item
                                        key={r}
                                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setOpen(false);
                                            onChangeRole?.(row.id, r);
                                        }}
                                    >
                                        {r === "GuestServices" ? "Guest Services" : r}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Separator className="h-px bg-slate-200 dark:bg-slate-800" />

                    <DropdownMenu.Item
                        className="px-3 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onDelete?.();
                        }}
                    >
                        Delete
                    </DropdownMenu.Item>

                    <DropdownMenu.Arrow className="fill-white dark:fill-slate-900" />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

/** ===== Small badges for role/status using Badge component ===== */
function RoleBadge({ role }: { role: AppRole }) {
    const variant = role === "Developer" ? "info" : role === "Imaginear" ? "primary" : "success";
    const label = role === "GuestServices" ? "Guest Services" : role;
    return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: AppStatus }) {
    const variant =
        status === "Approved" ? "success" :
        status === "Rejected" ? "danger" :
        status === "InReview" ? "warning" :
        "default";
    return <Badge variant={variant}>{status === "InReview" ? "In review" : status}</Badge>;
}
/** ===== Bulk actions dropdown (Radix Portal) ===== */
function BulkMenu({
                      onChangeStatus,
                  }: {
    onChangeStatus: (status: AppStatus) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    aria-label="Bulk change status"
                >
                    Bulk Actions ▾
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={6}
                    className="z-[9999] min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                >
                    <DropdownMenu.Label className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Change status to…
                    </DropdownMenu.Label>

                    {(["New", "InReview", "Approved", "Rejected"] as AppStatus[]).map(
                        (s) => (
                            <DropdownMenu.Item
                                key={s}
                                className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setOpen(false);
                                    onChangeStatus(s);
                                }}
                            >
                                {s}
                            </DropdownMenu.Item>
                        )
                    )}

                    <DropdownMenu.Arrow className="fill-white dark:fill-slate-900" />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

/** ===== CSV export helper (same signature you used earlier) ===== */
export function exportApplicationsCSV(rows: ApplicationRow[]) {
    const header = ["ID", "Name", "Email", "Role", "Status", "Submitted At"];
    const lines = [
        header.join(","),
        ...rows.map((r) =>
            [
                r.id,
                csvSafe(r.name),
                csvSafe(r.email),
                r.role,
                r.status,
                new Date(r.submittedAt).toISOString(),
            ].join(",")
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
function csvSafe(s: string) {
    if (s == null) return "";
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
}
