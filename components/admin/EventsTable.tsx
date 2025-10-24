"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Badge,
    EmptyState,
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuLabel,
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
    Tooltip,
} from "@/components/common";
import { CalendarRange, Edit, Eye, EyeOff, MapPin, Tag, Clock, ArrowUpDown, MoreVertical } from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import { useTableFilter } from "@/hooks/useTableFilter";
import { cn } from "@/lib/utils";

export type AdminEventRow = {
    id: string;
    title: string;
    server: string;
    category: string;
    status: "Draft" | "Published" | "Cancelled";
    startAt: string;         // ISO
    endAt: string;           // ISO
    timezone?: string;
    recurrenceFreq?: "NONE" | "DAILY" | "WEEKLY";
    byWeekday?: string[];
    times?: string[];
    recurrenceUntil?: string | null;
    updatedAt?: string;
    shortDescription?: string | null;
    details?: string | null;
};

export default function EventsTable({
                                        rows,
                                        onEdit,
                                        onStatusChange,
                                        isLoading,
                                    }: {
    rows?: AdminEventRow[];
    onEdit: (id: string) => void;
    onStatusChange?: (id: string, status: AdminEventRow["status"]) => void;
    isLoading?: boolean;
}) {
    const list = Array.isArray(rows) ? rows : [];
    
    // Sorting and filtering
    const { sortedData, requestSort, getSortIcon } = useTableSort(list, "startAt");
    const { filteredData, filterQuery, setFilterQuery } = useTableFilter(sortedData, (event, query) => {
        const q = query.toLowerCase();
        return (
            event.title.toLowerCase().includes(q) ||
            event.server.toLowerCase().includes(q) ||
            event.category.toLowerCase().includes(q) ||
            event.status.toLowerCase().includes(q)
        );
    });

    // Confirmation dialog state
    const [publishConfirm, setPublishConfirm] = useState<{
        open: boolean;
        id: string;
        title: string;
        action: "publish" | "unpublish";
    }>({
        open: false,
        id: "",
        title: "",
        action: "publish",
    });

    function fmt(dt: string) {
        try {
            const d = new Date(dt);
            return new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "2-digit",
                hour: "numeric",
                minute: "2-digit",
            }).format(d);
        } catch {
            return dt;
        }
    }

    // Handle publish/unpublish with confirmation
    const handlePublishClick = (id: string, title: string, currentStatus: AdminEventRow["status"]) => {
        const action = currentStatus === "Published" ? "unpublish" : "publish";
        setPublishConfirm({ open: true, id, title, action });
    };

    const handlePublishConfirm = () => {
        if (onStatusChange && publishConfirm.id) {
            const newStatus = publishConfirm.action === "publish" ? "Published" : "Draft";
            onStatusChange(publishConfirm.id, newStatus);
            toast.success(
                publishConfirm.action === "publish" ? "Event published" : "Event unpublished",
                {
                    description: `${publishConfirm.title} is now ${newStatus.toLowerCase()}.`,
                }
            );
        }
        setPublishConfirm({ open: false, id: "", title: "", action: "publish" });
    };

    const getSortIndicator = (key: keyof AdminEventRow) => {
        const icon = getSortIcon(key);
        return icon ? (
            <span className="inline-block ml-1">{icon}</span>
        ) : (
            <ArrowUpDown className="inline-block ml-1 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        );
    };

    // Loading state
    if (isLoading) {
        return <TableSkeleton columns={7} rows={5} />;
    }

    // Empty state
    if (!list.length) {
        return (
            <EmptyState
                icon={<CalendarRange className="w-12 h-12" />}
                title="No events found"
                description="Create your first event to get started organizing activities for your community."
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
        <>
            {/* Search Filter */}
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search events by title, server, category, or status..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    size="md"
                />
            </div>

            {/* Table */}
            <div className={cn(
                "overflow-x-auto rounded-xl shadow-sm",
                "border border-slate-300 dark:border-slate-800",
                "bg-white dark:bg-slate-900"
            )}>
                <table className="min-w-[820px] w-full bg-white dark:bg-slate-900" role="table" aria-label="Events table">
                    <thead className="bg-white dark:bg-slate-900/50">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th scope="col" className={cn(thClass, "pl-6")} onClick={() => requestSort("title")}>
                            Title{getSortIndicator("title")}
                        </th>
                        <th scope="col" className={thClass} onClick={() => requestSort("server")}>
                            Server{getSortIndicator("server")}
                        </th>
                        <th scope="col" className={thClass} onClick={() => requestSort("category")}>
                            Category{getSortIndicator("category")}
                        </th>
                        <th scope="col" className={thClass} onClick={() => requestSort("status")}>
                            Status{getSortIndicator("status")}
                        </th>
                        <th scope="col" className={thClass} onClick={() => requestSort("startAt")}>
                            Starts{getSortIndicator("startAt")}
                        </th>
                        <th scope="col" className={thClass} onClick={() => requestSort("endAt")}>
                            Ends{getSortIndicator("endAt")}
                        </th>
                        <th scope="col" className={cn(thClass, "pl-4 pr-6 text-right cursor-default hover:text-slate-600 dark:hover:text-slate-400")}>
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900">
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <CalendarRange className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                    <p className="text-slate-500 dark:text-slate-400">
                                        No events match your search
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((r) => (
                            <ContextMenu key={r.id}>
                                <ContextMenuTrigger asChild>
                                    <tr className={cn(
                                        "group transition-colors cursor-pointer",
                                        "bg-white dark:bg-slate-900",
                                        "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                                        "border-b border-slate-200 dark:border-slate-800",
                                        "last:border-0"
                                    )}>
                                        <td className="py-3.5 pl-6 pr-4 font-medium">
                                            <HoverCard>
                                                <HoverCardTrigger asChild>
                                                    <span className="cursor-pointer hover:underline">
                                                        {r.title}
                                                    </span>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-80">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                                {r.title}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <Badge
                                                                    variant={
                                                                        r.status === "Published" ? "success" :
                                                                        r.status === "Cancelled" ? "danger" :
                                                                        "default"
                                                                    }
                                                                >
                                                                    {r.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                                <MapPin className="w-4 h-4" />
                                                                <span><strong>Server:</strong> {r.server}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                                <Tag className="w-4 h-4" />
                                                                <span><strong>Category:</strong> {r.category}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{fmt(r.startAt)} - {fmt(r.endAt)}</span>
                                                            </div>
                                                        </div>
                                                        {r.shortDescription && (
                                                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                                                                    {r.shortDescription}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        </td>
                                        <td className="py-3.5 pr-4">{r.server}</td>
                                        <td className="py-3.5 pr-4">{r.category}</td>
                                        <td className="py-3.5 pr-4">
                                            <Badge
                                                variant={
                                                    r.status === "Published" ? "success" :
                                                    r.status === "Cancelled" ? "danger" :
                                                    "default"
                                                }
                                            >
                                                {r.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 pr-4">{fmt(r.startAt)}</td>
                                        <td className="py-3.5 pr-4">{fmt(r.endAt)}</td>
                                        <td className="py-3.5 pl-4 pr-6">
                                            <div className="flex justify-end">
                                            <RowActions
                                                status={r.status}
                                                onEdit={() => onEdit(r.id)}
                                                {...(onStatusChange && {
                                                    onTogglePublish: () => handlePublishClick(r.id, r.title, r.status)
                                                })}
                                            />
                                            </div>
                                        </td>
                                    </tr>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuLabel>Event Actions</ContextMenuLabel>
                                    <ContextMenuSeparator />
                                    <ContextMenuItem onSelect={() => onEdit(r.id)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Event
                                    </ContextMenuItem>
                                    {onStatusChange && (
                                        <>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem
                                                onSelect={() => handlePublishClick(r.id, r.title, r.status)}
                                            >
                                                {r.status === "Published" ? (
                                                    <>
                                                        <EyeOff className="w-4 h-4 mr-2" />
                                                        Unpublish
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Publish
                                                    </>
                                                )}
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

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={publishConfirm.open}
                onOpenChange={(open) => setPublishConfirm({ ...publishConfirm, open })}
                onConfirm={handlePublishConfirm}
                title={publishConfirm.action === "publish" ? "Publish Event?" : "Unpublish Event?"}
                description={
                    publishConfirm.action === "publish"
                        ? `Are you sure you want to publish "${publishConfirm.title}"? It will be visible to all users.`
                        : `Are you sure you want to unpublish "${publishConfirm.title}"? It will no longer be visible to users.`
                }
                confirmText={publishConfirm.action === "publish" ? "Publish" : "Unpublish"}
                cancelText="Cancel"
                variant={publishConfirm.action === "publish" ? "info" : "warning"}
            />
        </>
    );
}

/** Action menu that always overlays via Radix Portal */
function RowActions({
                        status,
                        onEdit,
                        onTogglePublish,
                    }: {
    status: AdminEventRow["status"];
    onEdit: () => void;
    onTogglePublish?: () => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <Tooltip content="Event actions" side="left">
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label="Open row actions"
                        className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-lg",
                            "border border-slate-300 dark:border-slate-700",
                            "bg-white dark:bg-slate-800",
                            "text-slate-700 dark:text-slate-300",
                            "hover:bg-slate-100 dark:hover:bg-slate-700",
                            "hover:border-slate-400 dark:hover:border-slate-600",
                            "transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                            "active:scale-95",
                            "data-[state=open]:bg-slate-100 data-[state=open]:dark:bg-slate-700"
                        )}
                    >
                        <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </button>
                </DropdownMenuTrigger>
            </Tooltip>

            {/* Portal ensures it renders outside any overflow/stacking contexts */}
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={6}
                    className="z-[9999] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden min-w-[160px]"
                >
                    <DropdownMenuItem
                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onEdit();
                        }}
                    >
                        Edit
                    </DropdownMenuItem>

                    {onTogglePublish && (
                        <DropdownMenuItem
                            className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setOpen(false);
                                onTogglePublish();
                            }}
                        >
                            {status === "Published" ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="h-px bg-slate-200 dark:bg-slate-800" />

                    <DropdownMenuItem
                        className="px-3 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            toast.info("Delete functionality coming soon");
                        }}
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}
