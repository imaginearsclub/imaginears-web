"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Checkbox, Badge, EmptyState, ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent, ConfirmDialog, HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/common";
import { FileText, Edit, FileCheck, Trash2, UserCog, CheckCircle, XCircle, Clock, Eye, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

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
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
        open: false,
        id: "",
        name: "",
    });
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

    // Handle delete with confirmation
    const handleDeleteClick = (id: string, name: string) => {
        setDeleteConfirm({ open: true, id, name });
    };

    const handleDeleteConfirm = () => {
        if (onDelete && deleteConfirm.id) {
            onDelete(deleteConfirm.id);
            toast.success("Application deleted", {
                description: `${deleteConfirm.name}'s application has been removed.`,
            });
        }
    };

    // Handle status change with toast
    const handleStatusChange = (id: string, status: AppStatus, name: string) => {
        if (onChangeStatus) {
            onChangeStatus(id, status);
            toast.success("Status updated", {
                description: `${name}'s application is now ${status}.`,
            });
        }
    };

    // Handle role change with toast
    const handleRoleChange = (id: string, role: AppRole, name: string) => {
        if (onChangeRole) {
            onChangeRole(id, role);
            toast.success("Role updated", {
                description: `${name} is now applying for ${role}.`,
            });
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
                        <ContextMenu key={r.id}>
                            <ContextMenuTrigger asChild>
                                <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                                    <td className="px-3 py-2">
                                        <Checkbox
                                            checked={selected.includes(r.id)}
                                            onCheckedChange={() => toggleOne(r.id)}
                                            aria-label={`Select ${r.name}`}
                                        />
                                    </td>
                                    <td className="px-3 py-2 font-medium">
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                {onEdit ? (
                                                    <a
                                                        className="hover:underline cursor-pointer"
                                                        href={`/admin/applications/${r.id}`}
                                                        onClick={(_e) => {
                                                            // if you prefer drawer-only, prevent default:
                                                            // _e.preventDefault(); onEdit(r.id);
                                                        }}
                                                    >
                                                        {r.name}
                                                    </a>
                                                ) : (
                                                    <span className="cursor-pointer">{r.name}</span>
                                                )}
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80">
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                            {r.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <RoleBadge role={r.role} />
                                                            <StatusBadge status={r.status} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                            <Mail className="w-4 h-4" />
                                                            <a href={`mailto:${r.email}`} className="hover:underline">
                                                                {r.email}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>Submitted {fmt(r.submittedAt)}</span>
                                                        </div>
                                                        {r.notes && (
                                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                    <strong>Notes:</strong> {r.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
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
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuLabel>Application Actions</ContextMenuLabel>
                                <ContextMenuSeparator />
                                
                                {onEdit && (
                                    <ContextMenuItem onSelect={() => onEdit(r.id)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Application
                                    </ContextMenuItem>
                                )}
                                
                                {onOpenNotes && (
                                    <ContextMenuItem onSelect={() => onOpenNotes(r.id)}>
                                        <FileCheck className="w-4 h-4 mr-2" />
                                        View Notes
                                    </ContextMenuItem>
                                )}
                                
                                {onChangeStatus && (
                                    <>
                                        <ContextMenuSeparator />
                                        <ContextMenuSub>
                                            <ContextMenuSubTrigger>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Change Status
                                            </ContextMenuSubTrigger>
                                            <ContextMenuSubContent>
                                                <ContextMenuItem onSelect={() => handleStatusChange(r.id, "New", r.name)}>
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    New
                                                </ContextMenuItem>
                                                <ContextMenuItem onSelect={() => handleStatusChange(r.id, "InReview", r.name)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    In Review
                                                </ContextMenuItem>
                                                <ContextMenuItem onSelect={() => handleStatusChange(r.id, "Approved", r.name)}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approved
                                                </ContextMenuItem>
                                                <ContextMenuItem onSelect={() => handleStatusChange(r.id, "Rejected", r.name)}>
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Rejected
                                                </ContextMenuItem>
                                            </ContextMenuSubContent>
                                        </ContextMenuSub>
                                    </>
                                )}
                                
                                {onChangeRole && (
                                    <ContextMenuSub>
                                        <ContextMenuSubTrigger>
                                            <UserCog className="w-4 h-4 mr-2" />
                                            Change Role
                                        </ContextMenuSubTrigger>
                                        <ContextMenuSubContent>
                                            <ContextMenuItem onSelect={() => handleRoleChange(r.id, "Developer", r.name)}>
                                                Developer
                                            </ContextMenuItem>
                                            <ContextMenuItem onSelect={() => handleRoleChange(r.id, "Imaginear", r.name)}>
                                                Imaginear
                                            </ContextMenuItem>
                                            <ContextMenuItem onSelect={() => handleRoleChange(r.id, "GuestServices", r.name)}>
                                                Guest Services
                                            </ContextMenuItem>
                                        </ContextMenuSubContent>
                                    </ContextMenuSub>
                                )}
                                
                                {onDelete && (
                                    <>
                                        <ContextMenuSeparator />
                                        <ContextMenuItem 
                                            onSelect={() => handleDeleteClick(r.id, r.name)}
                                            className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Application
                                        </ContextMenuItem>
                                    </>
                                )}
                            </ContextMenuContent>
                        </ContextMenu>
                    ))}

                    {!list.length && (
                        <tr>
                            <td colSpan={7} className="p-0">
                                <EmptyState
                                    icon={<FileText className="w-12 h-12 font-black dark:text-slate-600" />}
                                    title="No applications yet"
                                    description="Applications will appear here when users submit them through the application form."
                                />
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                onConfirm={handleDeleteConfirm}
                title="Delete Application?"
                description={`Are you sure you want to delete ${deleteConfirm.name}'s application? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
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
