import { memo, useCallback, useMemo } from "react";
import RowActions from "@/components/admin/RowActions";
import { Shield, Crown, User, Calendar, Globe } from "lucide-react";

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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.classes} transition-colors`}
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
                className={`relative flex h-2.5 w-2.5`}
                aria-label={online ? 'Online' : 'Offline'}
            >
                {online && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
            </span>
            <span className={online ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'}>
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
}: {
    player: Player;
    onMute: (name: string) => void | Promise<void>;
    onKick: (name: string) => void | Promise<void>;
    onTeleport: (name: string) => void | Promise<void>;
}) {
    // Sanitize data
    const safeName = useMemo(() => sanitizeString(player.name), [player.name]);
    const safeWorld = useMemo(() => sanitizeString(player.world), [player.world]);
    const formattedDate = useMemo(() => formatDate(player.joinedAt), [player.joinedAt]);

    // Memoize callbacks to prevent RowActions from re-rendering
    const handleMute = useCallback(() => onMute(safeName), [onMute, safeName]);
    const handleKick = useCallback(() => onKick(safeName), [onKick, safeName]);
    const handleTeleport = useCallback(() => onTeleport(safeName), [onTeleport, safeName]);

    return (
        <tr className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800 last:border-0">
            <td className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                        {safeName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                        {safeName}
                    </span>
                </div>
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
    );
});

// Main Table Component (memoized)
const PlayerTable = memo(function PlayerTable({
    rows,
    onMute,
    onKick,
    onTeleport,
}: PlayerTableProps) {
    // Empty state
    if (!rows || rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No players found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                    There are currently no players to display. Players will appear here when they join.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="min-w-full bg-white dark:bg-slate-900" role="table" aria-label="Players table">
                <thead className="bg-white dark:bg-slate-900/50">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th scope="col" className="py-3.5 pr-4 pl-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Player
                        </th>
                        <th scope="col" className="py-3.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Rank
                        </th>
                        <th scope="col" className="py-3.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            World
                        </th>
                        <th scope="col" className="py-3.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Status
                        </th>
                        <th scope="col" className="py-3.5 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Joined
                        </th>
                        <th scope="col" className="py-3.5 pl-4 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                    {rows.map((player) => (
                        <PlayerRow
                            key={`${player.name}-${player.joinedAt}`}
                            player={player}
                            onMute={onMute}
                            onKick={onKick}
                            onTeleport={onTeleport}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
});

export default PlayerTable;
