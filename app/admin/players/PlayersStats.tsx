import { memo, useMemo } from "react";
import { Badge, Card, CardContent } from "@/components/common";
import { Users, UserCheck, UserX, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player } from "@/components/admin/PlayerTable";

// Performance: Memoize StatCard to prevent unnecessary re-renders
const StatCard = memo(function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    changeType,
    accent
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number; 
    change?: string; 
    changeType?: "positive" | "negative" | "neutral";
    accent: "primary" | "success" | "warning" | "danger" | "info";
}) {
    const badgeVariant = changeType === "positive" ? "success" : changeType === "negative" ? "danger" : "default";
    
    return (
        <Card accent={accent} variant="elevated">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {label}
                        </p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                            {value}
                        </p>
                        {change && (
                            <Badge variant={badgeVariant} size="sm" className="mt-2">
                                {change}
                            </Badge>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            accent === "primary" && "bg-blue-100 dark:bg-blue-900/30",
                            accent === "success" && "bg-green-100 dark:bg-green-900/30",
                            accent === "warning" && "bg-amber-100 dark:bg-amber-900/30",
                            accent === "info" && "bg-sky-100 dark:bg-sky-900/30",
                        )}>
                            <Icon className={cn(
                                "w-6 h-6",
                                accent === "primary" && "text-blue-600 dark:text-blue-400",
                                accent === "success" && "text-green-600 dark:text-green-400",
                                accent === "warning" && "text-amber-600 dark:text-amber-400",
                                accent === "info" && "text-sky-600 dark:text-sky-400",
                            )} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});

// Performance: Memoize the entire stats component
export const PlayersStats = memo(function PlayersStats({ players }: { players: Player[] }) {
    // Performance: Memoize expensive calculations
    const stats = useMemo(() => {
        const totalPlayers = players.length;
        const onlinePlayers = players.filter(p => p.online).length;
        const offlinePlayers = totalPlayers - onlinePlayers;
        const staffCount = players.filter(p => p.rank === "Staff" || p.rank === "Creator").length;
        const onlinePercentage = ((onlinePlayers / Math.max(totalPlayers, 1)) * 100).toFixed(0);
        
        return {
            totalPlayers,
            onlinePlayers,
            offlinePlayers,
            staffCount,
            onlinePercentage,
            isActive: onlinePlayers > 0,
        };
    }, [players]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                icon={Users}
                label="Total Players"
                value={stats.totalPlayers}
                change={`${stats.staffCount} staff members`}
                changeType="neutral"
                accent="primary"
            />
            <StatCard
                icon={UserCheck}
                label="Online"
                value={stats.onlinePlayers}
                change={`${stats.onlinePercentage}% of total`}
                changeType="positive"
                accent="success"
            />
            <StatCard
                icon={UserX}
                label="Offline"
                value={stats.offlinePlayers}
                change="Last seen recently"
                changeType="neutral"
                accent="warning"
            />
            <StatCard
                icon={Activity}
                label="Server Status"
                value={stats.isActive ? "Active" : "Idle"}
                change={stats.isActive ? "Players connected" : "No activity"}
                changeType={stats.isActive ? "positive" : "neutral"}
                accent="info"
            />
        </div>
    );
});

