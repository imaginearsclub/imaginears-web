"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
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
} from "@/components/common";
import { CalendarRange, Edit, Eye, EyeOff, Calendar, MapPin, Tag, Clock, ArrowUpDown } from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import { useTableFilter } from "@/hooks/useTableFilter";

export type AdminEventRow = {
    id: string;
    title: string;
    world: string;
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
            event.world.toLowerCase().includes(q) ||
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
    };

    const getSortIndicator = (key: keyof AdminEventRow) => {
        const icon = getSortIcon(key);
        if (!icon) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
        return icon === "asc" ? "↑" : "↓";
    };

    return (
        <div className="overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-[820px] w-full">
                <thead className="text-left text-sm text-slate-600 dark:text-slate-300">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">World</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Starts</th>
                    <th className="px-3 py-2">Ends</th>
                    <th className="px-3 py-2 w-12"></th>
                </tr>
                </thead>
                <tbody className="text-sm">
                {list.map((r) => (
                    <ContextMenu key={r.id}>
                        <ContextMenuTrigger asChild>
                            <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                                <td className="px-3 py-2 font-medium">{r.title}</td>
                                <td className="px-3 py-2">{r.world}</td>
                                <td className="px-3 py-2">{r.category}</td>
                                <td className="px-3 py-2">
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
                                <td className="px-3 py-2">{fmt(r.startAt)}</td>
                                <td className="px-3 py-2">{fmt(r.endAt)}</td>
                                <td className="px-3 py-2 text-right">
                                    <RowActions
                                        status={r.status}
                                        onEdit={() => onEdit(r.id)}
                                        {...(onStatusChange && {
                                            onTogglePublish: () =>
                                                onStatusChange(
                                                    r.id,
                                                    r.status === "Published" ? "Draft" : "Published"
                                                )
                                        })}
                                    />
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
                                        onSelect={() => onStatusChange(r.id, r.status === "Published" ? "Draft" : "Published")}
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
                ))}

                {!list.length && (
                    <tr>
                        <td colSpan={7} className="p-0">
                            <EmptyState
                                icon={<CalendarRange className="w-12 h-12" />}
                                title="No events found"
                                description="Create your first event to get started organizing activities for your community."
                            />
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
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
        <DropdownMenu.Root open={open} onOpenChange={setOpen}>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    aria-label="Open row actions"
                >
                    ⋯
                </button>
            </DropdownMenu.Trigger>

            {/* Portal ensures it renders outside any overflow/stacking contexts */}
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-[9999] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden min-w-[160px]"
                >
                    <DropdownMenu.Item
                        className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            onEdit();
                        }}
                    >
                        Edit
                    </DropdownMenu.Item>

                    {onTogglePublish && (
                        <DropdownMenu.Item
                            className="px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                            onSelect={(e) => {
                                e.preventDefault();
                                setOpen(false);
                                onTogglePublish();
                            }}
                        >
                            {status === "Published" ? "Unpublish" : "Publish"}
                        </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Separator className="h-px bg-slate-200 dark:bg-slate-800" />

                    <DropdownMenu.Item
                        className="px-3 py-2 text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 cursor-pointer"
                        onSelect={(e) => {
                            e.preventDefault();
                            setOpen(false);
                            toast.info("Delete functionality coming soon");
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
