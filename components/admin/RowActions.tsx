"use client";

import { memo, useCallback, useState } from "react";
import { MoreVertical, VolumeX, UserX, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    Spinner,
    Badge,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuPortal,
} from "@/components/common";

interface RowActionsProps {
    name: string;
    online: boolean;
    onMute: () => void | Promise<void>;
    onKick: () => void | Promise<void>;
    onTeleport: () => void | Promise<void>;
}

const RowActions = memo(function RowActions({
    name,
    online,
    onMute,
    onKick,
    onTeleport,
}: RowActionsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    // Handle action with loading state and toast feedback
    const handleAction = useCallback(async (
        action: () => void | Promise<void>, 
        actionName: string
    ) => {
        setLoading(actionName);
        
        const toastPromise = (async () => {
            await action();
            setOpen(false);
        })();
        
        toast.promise(toastPromise, {
            loading: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)}ing ${name}...`,
            success: `Successfully ${actionName}ed ${name}`,
            error: (err) => `Failed to ${actionName} ${name}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
        
        try {
            await toastPromise;
        } finally {
            setLoading(null);
        }
    }, [name]);

    // Memoized action handlers
    const handleMute = useCallback(() => handleAction(onMute, "mute"), [handleAction, onMute]);
    const handleKick = useCallback(() => handleAction(onKick, "kick"), [handleAction, onKick]);
    const handleTeleport = useCallback(() => handleAction(onTeleport, "teleport"), [handleAction, onTeleport]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <Tooltip content="Player actions" side="left">
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Actions for ${name}`}
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

            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className={cn(
                        "w-52 rounded-xl overflow-hidden z-50",
                        "border border-slate-300 dark:border-slate-700",
                        "bg-white dark:bg-slate-900 shadow-xl",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[side=bottom]:slide-in-from-top-2",
                        "data-[side=left]:slide-in-from-right-2",
                        "data-[side=right]:slide-in-from-left-2",
                        "data-[side=top]:slide-in-from-bottom-2"
                    )}
                >
                    {/* Header */}
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Badge 
                                variant={online ? "success" : "default"} 
                                size="sm"
                                className="text-[10px] px-1.5 py-0"
                            >
                                {online ? 'Online' : 'Offline'}
                            </Badge>
                        </div>
                    </div>

                    <DropdownMenuSeparator />

                    {/* Actions */}
                    <div className="py-1">
                        <MenuItem
                            icon={<VolumeX className="w-4 h-4" />}
                            label="Mute (10m)"
                            description="Temporarily mute player"
                            onClick={handleMute}
                            disabled={loading !== null}
                            loading={loading === "mute"}
                        />

                        <MenuItem
                            icon={<UserX className="w-4 h-4" />}
                            label="Kick"
                            description="Remove from server"
                            onClick={handleKick}
                            disabled={!online || loading !== null}
                            loading={loading === "kick"}
                            variant="danger"
                        />

                        <MenuItem
                            icon={<MapPin className="w-4 h-4" />}
                            label="Teleport to Hub"
                            description="Send to main hub"
                            onClick={handleTeleport}
                            disabled={!online || loading !== null}
                            loading={loading === "teleport"}
                        />
                    </div>

                    {/* Warning for offline actions */}
                    {!online && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20">
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Some actions require player to be online
                                </p>
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
});

// Menu Item Component
interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: "default" | "danger";
}

const MenuItem = memo(function MenuItem({
    icon,
    label,
    description,
    onClick,
    disabled = false,
    loading = false,
    variant = "default",
}: MenuItemProps) {
    const handleSelect = useCallback((e: Event) => {
        e.preventDefault();
        if (!disabled && !loading) {
            onClick();
        }
    }, [disabled, loading, onClick]);

    return (
        <DropdownMenuItem
            onSelect={handleSelect}
            disabled={disabled || loading}
            className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 text-sm",
                "transition-colors bg-transparent outline-none",
                variant === "danger" 
                    ? "text-red-700 dark:text-red-400 data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-900/20"
                    : "text-slate-700 dark:text-slate-200 data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            )}
        >
            <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
                {loading ? (
                    <Spinner size="sm" variant="current" label="Loading action" />
                ) : icon}
            </span>
            <div className="flex-1 text-left">
                <div className="font-medium">{label}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{description}</div>
            </div>
        </DropdownMenuItem>
    );
});

export default RowActions;
