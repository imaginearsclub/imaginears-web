"use client";

import { useState, useMemo } from "react";
import { 
    Checkbox, 
    Badge, 
    EmptyState, 
    ContextMenu, 
    ContextMenuTrigger, 
    ContextMenuContent, 
    ContextMenuItem, 
    ContextMenuSeparator, 
    ContextMenuLabel, 
    ContextMenuSub, 
    ContextMenuSubTrigger, 
    ContextMenuSubContent, 
    ConfirmDialog, 
    HoverCard, 
    HoverCardTrigger, 
    HoverCardContent,
    Input,
    TableSkeleton,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuLabel,
} from "@/components/common";
import { FileText, Edit, FileCheck, Trash2, UserCog, CheckCircle, XCircle, Clock, Eye, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
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
                                             isLoading,
                                         }: {
    rows?: ApplicationRow[];
    onEdit?: (id: string) => void;
    onOpenNotes?: (id: string) => void;
    onChangeStatus?: (id: string, status: AppStatus) => void;
    onChangeRole?: (id: string, role: AppRole) => void;
    onDelete?: (id: string) => void;
    onExportCSV?: () => void;
    onBulkChangeStatus?: (ids: string[], status: AppStatus) => Promise<void> | void;
    isLoading?: boolean;
}) {
    const list = Array.isArray(rows) ? rows : [];
    const [searchQuery, setSearchQuery] = useState("");

    const [selected, setSelected] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
        open: false,
        id: "",
        name: "",
    });

    // Filter applications based on search query
    const filteredList = useMemo(() => {
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(app =>
            app.name.toLowerCase().includes(q) ||
            app.email.toLowerCase().includes(q) ||
            app.role.toLowerCase().includes(q) ||
            app.status.toLowerCase().includes(q)
        );
    }, [list, searchQuery]);

    const allSelected = selected.length > 0 && selected.length === filteredList.length;
    const someSelected = selected.length > 0 && selected.length < filteredList.length;

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

    // Loading state
    if (isLoading) {
        return <TableSkeleton columns={7} rows={5} />;
    }

    // Empty state
    if (!list.length) {
        return (
            <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No applications yet"
                description="Applications will appear here when users submit them through the application form."
            />
        );
    }

    const thClass = cn(
        "py-3.5 pr-4 text-left cursor-pointer select-none group",
        "text-xs font-semibold uppercase tracking-wider",
        "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
        "transition-colors"
    );

    return (
        <div className="space-y-3">
            {/* Search Filter */}
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search applications by name, email, role, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="md"
                />
            </div>
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

            <div className={cn(
                "overflow-x-auto rounded-xl shadow-sm",
                "border border-slate-300 dark:border-slate-800",
                "bg-white dark:bg-slate-900"
            )}>
                <table className="min-w-[900px] w-full bg-white dark:bg-slate-900" role="table" aria-label="Applications table">
                    <thead className="bg-white dark:bg-slate-900/50">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th scope="col" className={cn(thClass, "pl-6 pr-3 w-10 cursor-default hover:text-slate-600 dark:hover:text-slate-400")}>
                            <label className="inline-flex items-center gap-2">
                                <Checkbox
                                    checked={someSelected ? "indeterminate" : allSelected}
                                    onCheckedChange={toggleAll}
                                    aria-label="Select all applications"
                                />
                            </label>
                        </th>
                        <th scope="col" className={thClass}>Name</th>
                        <th scope="col" className={thClass}>Email</th>
                        <th scope="col" className={thClass}>Role</th>
                        <th scope="col" className={thClass}>Status</th>
                        <th scope="col" className={thClass}>Submitted</th>
                        <th scope="col" className={cn(thClass, "pl-4 pr-6 text-right cursor-default hover:text-slate-600 dark:hover:text-slate-400")}>Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900">
                    {filteredList.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                    <p className="text-slate-500 dark:text-slate-400">
                                        No applications match your search
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredList.map((r) => (
                        <ContextMenu key={r.id}>
                            <ContextMenuTrigger asChild>
                                <tr className={cn(
                                    "group transition-colors cursor-pointer",
                                    "bg-white dark:bg-slate-900",
                                    "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                    "border-b border-slate-200 dark:border-slate-800",
                                    "last:border-0"
                                )}>
                                    <td className="py-3.5 pl-6 pr-3">
                                        <Checkbox
                                            checked={selected.includes(r.id)}
                                            onCheckedChange={() => toggleOne(r.id)}
                                            aria-label={`Select ${r.name}`}
                                        />
                                    </td>
                                    <td className="py-3.5 pr-4 font-medium">
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
                                    <td className="py-3.5 pr-4">
                                        <a className="underline" href={`mailto:${r.email}`}>
                                            {r.email}
                                        </a>
                                    </td>
                                    <td className="py-3.5 pr-4">
                                        <RoleBadge role={r.role} />
                                    </td>
                                    <td className="py-3.5 pr-4">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="py-3.5 pr-4">{fmt(r.submittedAt)}</td>
                                    <td className="py-3.5 pl-4 pr-6 text-right">
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
                    ))
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
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button type="button" className="btn btn-ghost btn-xs" aria-label="Open row actions">
                    ⋯
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={6}
                    className="z-[9999] min-w-[210px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                >
                    <DropdownMenuItem
                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onEdit?.();
                        }}
                    >
                        Edit
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onOpenNotes?.();
                        }}
                    >
                        Notes
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            Change status →
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                className="z-[10000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                                sideOffset={6}
                                alignOffset={-4}
                            >
                                {(["New", "InReview", "Approved", "Rejected"] as AppStatus[]).map((s) => (
                                    <DropdownMenuItem
                                        key={s}
                                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setOpen(false);
                                            onChangeStatus?.(row.id, s);
                                        }}
                                    >
                                        {s}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                            Change role →
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                className="z-[10000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                                sideOffset={6}
                                alignOffset={-4}
                            >
                                {(["Developer", "Imaginear", "GuestServices"] as AppRole[]).map((r) => (
                                    <DropdownMenuItem
                                        key={r}
                                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setOpen(false);
                                            onChangeRole?.(row.id, r);
                                        }}
                                    >
                                        {r === "GuestServices" ? "Guest Services" : r}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator className="h-px bg-slate-200 dark:bg-slate-800" />

                    <DropdownMenuItem
                        className="px-3 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onDelete?.();
                        }}
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
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
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    aria-label="Bulk change status"
                >
                    Bulk Actions ▾
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    className="z-[9999] min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
                >
                    <DropdownMenuLabel className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Change status to…
                    </DropdownMenuLabel>

                    {(["New", "InReview", "Approved", "Rejected"] as AppStatus[]).map(
                        (s) => (
                            <DropdownMenuItem
                                key={s}
                                className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setOpen(false);
                                    onChangeStatus(s);
                                }}
                            >
                                {s}
                            </DropdownMenuItem>
                        )
                    )}
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
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
