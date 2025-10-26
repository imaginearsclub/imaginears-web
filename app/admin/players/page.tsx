"use client";

import { useEffect, useState } from "react";
import PlayerTable, { type Player } from "@/components/admin/PlayerTable";
import { Button, Card, CardContent, Badge } from "@/components/common";
import { Users, UserCheck, UserX, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Stats Card Component
function StatCard({ 
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
    const cardAccent: "primary" | "success" | "warning" | "danger" | "info" = accent;
    
    return (
        <Card accent={cardAccent} variant="elevated">
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
}

export default function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch players on mount
    useEffect(() => {
        loadPlayers();
        
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(loadPlayers, 30000);
        return () => clearInterval(interval);
    }, []);

    async function loadPlayers() {
        try {
            const res = await fetch("/api/admin/players", { 
                cache: "no-store",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            });
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            
            const data = await res.json();
            setPlayers(Array.isArray(data.players) ? data.players : []);
        } catch (error: any) {
            console.error("[Players] Load error:", error);
            toast.error("Failed to load player data");
        } finally {
            setLoading(false);
        }
    }

    // Player actions
    const handleMute = async (name: string) => {
        if (actionLoading) return;
        
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/players/mute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerName: name }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || `HTTP ${res.status}`);
            }

            toast.success(`${name} has been muted`);
            await loadPlayers(); // Refresh player list
        } catch (error: any) {
            console.error("[Players] Mute error:", error);
            toast.error(error.message || "Failed to mute player");
        } finally {
            setActionLoading(false);
        }
    };

    const handleKick = async (name: string) => {
        if (actionLoading) return;
        
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/players/kick", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerName: name }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || `HTTP ${res.status}`);
            }

            toast.success(`${name} has been kicked from the server`);
            await loadPlayers(); // Refresh player list
        } catch (error: any) {
            console.error("[Players] Kick error:", error);
            toast.error(error.message || "Failed to kick player");
        } finally {
            setActionLoading(false);
        }
    };

    const handleTeleport = async (name: string) => {
        if (actionLoading) return;
        
        setActionLoading(true);
        try {
            const res = await fetch("/api/admin/players/teleport", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerName: name }),
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || `HTTP ${res.status}`);
            }

            toast.success(`Teleporting to ${name}...`);
        } catch (error: any) {
            console.error("[Players] Teleport error:", error);
            toast.error(error.message || "Failed to teleport");
        } finally {
            setActionLoading(false);
        }
    };

    // Calculate stats
    const totalPlayers = players.length;
    const onlinePlayers = players.filter(p => p.online).length;
    const offlinePlayers = totalPlayers - onlinePlayers;
    const staffCount = players.filter(p => p.rank === "Staff" || p.rank === "Creator").length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Players
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                Monitor and manage online players • Updates every 30s
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="primary" 
                        size="md"
                        onClick={loadPlayers}
                        isLoading={loading}
                        loadingText="Refreshing..."
                        leftIcon={<RefreshCw />}
                        ariaLabel="Refresh player list"
                    >
                        Refresh
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={Users}
                        label="Total Players"
                        value={totalPlayers}
                        change={`${staffCount} staff members`}
                        changeType="neutral"
                        accent="primary"
                    />
                    <StatCard
                        icon={UserCheck}
                        label="Online"
                        value={onlinePlayers}
                        change={`${((onlinePlayers / Math.max(totalPlayers, 1)) * 100).toFixed(0)}% of total`}
                        changeType="positive"
                        accent="success"
                    />
                    <StatCard
                        icon={UserX}
                        label="Offline"
                        value={offlinePlayers}
                        change="Last seen recently"
                        changeType="neutral"
                        accent="warning"
                    />
                    <StatCard
                        icon={Activity}
                        label="Server Status"
                        value={onlinePlayers > 0 ? "Active" : "Idle"}
                        change={onlinePlayers > 0 ? "Players connected" : "No activity"}
                        changeType={onlinePlayers > 0 ? "positive" : "neutral"}
                        accent="info"
                    />
                </div>

                {/* Players Table */}
                <Card accent="success" variant="elevated">
                    <CardContent className="p-0">
                        <PlayerTable
                            rows={players}
                            onMute={handleMute}
                            onKick={handleKick}
                            onTeleport={handleTeleport}
                            isLoading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
