import { memo, useCallback, useMemo, useState } from "react";
import RowActions from "@/components/admin/RowActions";
import { Shield, Crown, User, Calendar, Globe, Volume2, UserX, Navigation, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    Avatar, 
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
    TableSkeleton 
} from "@/components/common";
import { toast } from "sonner";
import { useTableSort } from "@/hooks/useTableSort";
import { useTableFilter } from "@/hooks/useTableFilter";

export type Player = {
    name: string;
    rank: "Member" | "Creator" | "Staff";
    world: string;
    online: boolean;
    joinedAt: string; // YYYY-MM-DD
};

interface PlayerTableProps {
    rows: Player[];
    onMute: (name: string) => void | Promise<void>;
    onKick: (name: string) => void | Promise<void>;
    onTeleport: (name: string) => void | Promise<void>;
    isLoading?: boolean;
}

// Sanitize string to prevent XSS attacks
function sanitizeString(str: string): string {
    if (typeof str !== 'string') return '';
    return str
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim()
        .slice(0, 100); // Limit length
}

// Format date in a safe, readable way
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid date';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    } catch {
        return 'Invalid date';
    }
}

// Rank Badge Component (memoized)
const RankBadge = memo(function RankBadge({ rank }: { rank: Player['rank'] }) {
    const config = useMemo(() => {
        switch (rank) {
            case 'Staff':
                return {
                    icon: Shield,
                    classes: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
                    label: 'Staff Member'
                };
            case 'Creator':
                return {
                    icon: Crown,
                    classes: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
                    label: 'Content Creator'
                };
            default:
                return {
                    icon: User,
                    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700',
                    label: 'Member'
                };
        }
    }, [rank]);

    const Icon = config.icon;

    return (
        <span 
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                config.classes
            )}
            aria-label={config.label}
        >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {rank}
        </span>
    );
});

// Status Badge Component (memoized)
const StatusBadge = memo(function StatusBadge({ online }: { online: boolean }) {
    return (
        <span className="inline-flex items-center gap-2 text-sm">
            <span 
                className="relative flex h-2.5 w-2.5"
                aria-label={online ? 'Online' : 'Offline'}
            >
                {online && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={cn(
                    "relative inline-flex rounded-full h-2.5 w-2.5",
                    online ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'
                )} />
            </span>
            <span className={cn(
                online ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'
            )}>
                {online ? 'Online' : 'Offline'}
            </span>
        </span>
    );
});

// Player Row Component (memoized)
const PlayerRow = memo(function PlayerRow({
    player,
    onMute,
    onKick,
    onTeleport,
    onKickClick,
    onMuteClick,
}: {
    player: Player;
    onMute: (name: string) => void | Promise<void>;
    onKick: (name: string) => void | Promise<void>;
    onTeleport: (name: string) => void | Promise<void>;
    onKickClick: (name: string) => void;
    onMuteClick: (name: string) => void;
}) {
    // Sanitize data
    const safeName = useMemo(() => sanitizeString(player.name), [player.name]);
    const safeWorld = useMemo(() => sanitizeString(player.world), [player.world]);
    const formattedDate = useMemo(() => formatDate(player.joinedAt), [player.joinedAt]);

    // Memoize callbacks to prevent RowActions from re-rendering
    const handleMute = useCallback(() => onMute(safeName), [onMute, safeName]);
    const handleKick = useCallback(() => onKick(safeName), [onKick, safeName]);
    const handleTeleport = useCallback(() => onTeleport(safeName), [onTeleport, safeName]);
    const handleKickClick = useCallback(() => onKickClick(safeName), [onKickClick, safeName]);
    const handleMuteClick = useCallback(() => onMuteClick(safeName), [onMuteClick, safeName]);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <tr className={cn(
                    "group transition-colors cursor-pointer",
                    "bg-white dark:bg-slate-900",
                    "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    "border-b border-slate-200 dark:border-slate-800",
                    "last:border-0"
                )}>
                    <td className="py-3.5 pl-6 pr-4">
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <div className="flex items-center gap-2.5 cursor-pointer">
                                    <Avatar
                                        src={`https://minotar.net/avatar/${encodeURIComponent(safeName)}/100`}
                                        alt={`${safeName}'s Minecraft avatar`}
                                        fallback={safeName.charAt(0).toUpperCase()}
                                        size="sm"
                                        shape="square"
                                    />
                                    <span className="font-semibold text-slate-900 dark:text-white hover:underline">
                                        {safeName}
                                    </span>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={`https://minotar.net/avatar/${encodeURIComponent(safeName)}/100`}
                                            alt={`${safeName}'s Minecraft avatar`}
                                            fallback={safeName.charAt(0).toUpperCase()}
                                            size="lg"
                                            shape="square"
                                        />
                                        <div className="flex-1">
                                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                                {safeName}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <RankBadge rank={player.rank} />
                                                <StatusBadge online={player.online} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Globe className="w-4 h-4" />
                                            <span>Currently in: <strong>{safeWorld}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>Joined {formattedDate}</span>
                                        </div>
                                    </div>
                                    {player.online && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                ● Active now
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </td>
                    <td className="py-3.5 pr-4">
                        <RankBadge rank={player.rank} />
                    </td>
                    <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
                            <span>{safeWorld}</span>
                        </div>
                    </td>
                    <td className="py-3.5 pr-4">
                        <StatusBadge online={player.online} />
                    </td>
                    <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            <time dateTime={player.joinedAt}>{formattedDate}</time>
                        </div>
                    </td>
                    <td className="py-3.5 pl-4 pr-6">
                        <div className="flex justify-end">
                            <RowActions
                                name={safeName}
                                online={player.online}
                                onMute={handleMute}
                                onKick={handleKick}
                                onTeleport={handleTeleport}
                            />
                        </div>
                    </td>
                </tr>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuLabel>Player Actions</ContextMenuLabel>
                <ContextMenuSeparator />
                
                {player.online && (
                    <>
                        <ContextMenuItem onSelect={handleTeleport}>
                            <Navigation className="w-4 h-4 mr-2" />
                            Teleport to Player
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}
                
                <ContextMenuItem onSelect={handleMuteClick}>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Mute Player
                </ContextMenuItem>
                
                <ContextMenuSeparator />
                
                <ContextMenuItem 
                    onSelect={handleKickClick}
                    className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                    <UserX className="w-4 h-4 mr-2" />
                    Kick Player
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
});

// Main Table Component (memoized)
const PlayerTable = memo(function PlayerTable({
    rows,
    onMute,
    onKick,
    onTeleport,
    isLoading,
}: PlayerTableProps) {
    const list = Array.isArray(rows) ? rows : [];

    // Sorting and filtering
    const { sortedData, requestSort, getSortIcon } = useTableSort(list, "joinedAt");
    const { filteredData, filterQuery, setFilterQuery } = useTableFilter(sortedData, (player, query) => {
        const q = query.toLowerCase();
        return (
            player.name.toLowerCase().includes(q) ||
            player.rank.toLowerCase().includes(q) ||
            player.world.toLowerCase().includes(q)
        );
    });

    // Confirmation dialogs
    const [kickConfirm, setKickConfirm] = useState({ open: false, name: "" });
    const [muteConfirm, setMuteConfirm] = useState({ open: false, name: "" });

    // Handlers for confirmation dialogs
    const handleKickClick = useCallback((name: string) => {
        setKickConfirm({ open: true, name });
    }, []);

    const handleMuteClick = useCallback((name: string) => {
        setMuteConfirm({ open: true, name });
    }, []);

    const handleKickConfirm = useCallback(async () => {
        try {
            await onKick(kickConfirm.name);
            toast.success(`${kickConfirm.name} has been kicked from the server`);
            setKickConfirm({ open: false, name: "" });
        } catch (error) {
            toast.error(`Failed to kick ${kickConfirm.name}`);
            console.error("Kick error:", error);
        }
    }, [kickConfirm.name, onKick]);

    const handleMuteConfirm = useCallback(async () => {
        try {
            await onMute(muteConfirm.name);
            toast.success(`${muteConfirm.name} has been muted`);
            setMuteConfirm({ open: false, name: "" });
        } catch (error) {
            toast.error(`Failed to mute ${muteConfirm.name}`);
            console.error("Mute error:", error);
        }
    }, [muteConfirm.name, onMute]);

    const handleTeleport = useCallback(async (name: string) => {
        try {
            await onTeleport(name);
            toast.success(`Teleporting to ${name}...`);
        } catch (error) {
            toast.error(`Failed to teleport to ${name}`);
            console.error("Teleport error:", error);
        }
    }, [onTeleport]);

    // Helper for sort icons
    const getSortIndicator = (key: keyof Player) => {
        const icon = getSortIcon(key);
        return icon ? (
            <span className="inline-block ml-1">{icon}</span>
        ) : (
            <ArrowUpDown className="inline-block ml-1 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        );
    };

    // Loading state
    if (isLoading) {
        return <TableSkeleton columns={6} rows={5} />;
    }

    // Empty state
    if (!list || list.length === 0) {
        return (
            <EmptyState
                icon={<User className="w-12 h-12" />}
                title="No players found"
                description="There are currently no players to display. Players will appear here when they join."
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
                <input
                    type="text"
                    placeholder="Search players by name, rank, or world..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className={cn(
                        "w-full px-4 py-2.5 rounded-lg",
                        "bg-white dark:bg-slate-900",
                        "border border-slate-300 dark:border-slate-700",
                        "text-slate-900 dark:text-slate-100",
                        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
                        "transition-shadow"
                    )}
                />
            </div>

            {/* Table */}
            <div className={cn(
                "overflow-x-auto rounded-xl shadow-sm",
                "border border-slate-300 dark:border-slate-800",
                "bg-white dark:bg-slate-900"
            )}>
                <table className="min-w-full bg-white dark:bg-slate-900" role="table" aria-label="Players table">
                    <thead className="bg-white dark:bg-slate-900/50">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th scope="col" className={cn(thClass, "pl-6")} onClick={() => requestSort("name")}>
                                Player{getSortIndicator("name")}
                            </th>
                            <th scope="col" className={thClass} onClick={() => requestSort("rank")}>
                                Rank{getSortIndicator("rank")}
                            </th>
                            <th scope="col" className={thClass} onClick={() => requestSort("world")}>
                                World{getSortIndicator("world")}
                            </th>
                            <th scope="col" className={thClass} onClick={() => requestSort("online")}>
                                Status{getSortIndicator("online")}
                            </th>
                            <th scope="col" className={thClass} onClick={() => requestSort("joinedAt")}>
                                Joined{getSortIndicator("joinedAt")}
                            </th>
                            <th scope="col" className={cn(thClass, "pl-4 pr-6 text-right cursor-default hover:text-slate-600 dark:hover:text-slate-400")}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <User className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            No players match your search
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((player) => (
                                <PlayerRow
                                    key={`${player.name}-${player.joinedAt}`}
                                    player={player}
                                    onMute={onMute}
                                    onKick={onKick}
                                    onTeleport={handleTeleport}
                                    onKickClick={handleKickClick}
                                    onMuteClick={handleMuteClick}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={kickConfirm.open}
                onOpenChange={(open) => setKickConfirm({ ...kickConfirm, open })}
                onConfirm={handleKickConfirm}
                title="Kick Player?"
                description={`Are you sure you want to kick ${kickConfirm.name} from the server? They will be able to rejoin immediately.`}
                confirmText="Kick Player"
                cancelText="Cancel"
                variant="danger"
            />

            <ConfirmDialog
                open={muteConfirm.open}
                onOpenChange={(open) => setMuteConfirm({ ...muteConfirm, open })}
                onConfirm={handleMuteConfirm}
                title="Mute Player?"
                description={`Are you sure you want to mute ${muteConfirm.name}? They will not be able to chat until unmuted.`}
                confirmText="Mute Player"
                cancelText="Cancel"
                variant="warning"
            />
        </>
    );
});

export default PlayerTable;
