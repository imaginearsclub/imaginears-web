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
} from "@/components/common";
import { CalendarRange, Edit, Eye, EyeOff } from "lucide-react";

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
                                    }: {
    rows?: AdminEventRow[];
    onEdit: (id: string) => void;
    onStatusChange?: (id: string, status: AdminEventRow["status"]) => void;
}) {
    const list = Array.isArray(rows) ? rows : [];

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
