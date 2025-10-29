import { Users, Activity, Wifi } from "lucide-react";

interface ServerStatsProps {
    online: boolean;
    players: { online: number; max: number };
    latency: number | undefined;
    uptimePercentage: number | null;
}

export function ServerStats({ online, players, latency, uptimePercentage }: ServerStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Players
                    </p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {players.online}/{players.max}
                </p>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Latency
                    </p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {online ? (latency ? `${latency}ms` : "—") : "N/A"}
                </p>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Uptime
                    </p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {uptimePercentage !== null && uptimePercentage !== undefined
                        ? `${uptimePercentage}%`
                        : "—"}
                </p>
            </div>
        </div>
    );
}

