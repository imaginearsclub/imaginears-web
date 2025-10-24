"use client";

import { useEffect, useState } from "react";
import PlayerTable, { type Player } from "@/components/admin/PlayerTable";
import { Spinner } from "@/components/common";
import { Users, UserCheck, UserX, Activity } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Stats Card Component
function StatCard({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    changeType 
}: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number; 
    change?: string; 
    changeType?: "positive" | "negative" | "neutral";
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                        {value}
                    </p>
                    {change && (
                        <p className={cn(
                            "text-xs font-medium mt-2",
                            changeType === "positive" && "text-green-600 dark:text-green-400",
                            changeType === "negative" && "text-red-600 dark:text-red-400",
                            changeType === "neutral" && "text-slate-600 dark:text-slate-400"
                        )}>
                            {change}
                        </p>
                    )}
                </div>
                <div className="ml-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
            </div>
        </div>
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
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                                Players
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Monitor and manage online players • Updates every 30s
                            </p>
                        </div>
                        <button
                            onClick={loadPlayers}
                            disabled={loading}
                            className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                "bg-blue-600 dark:bg-blue-500 text-white",
                                "hover:bg-blue-700 dark:hover:bg-blue-600",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" />
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <Activity className="w-4 h-4" />
                                    Refresh
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Users}
                        label="Total Players"
                        value={totalPlayers}
                        change={`${staffCount} staff members`}
                        changeType="neutral"
                    />
                    <StatCard
                        icon={UserCheck}
                        label="Online"
                        value={onlinePlayers}
                        change={`${((onlinePlayers / Math.max(totalPlayers, 1)) * 100).toFixed(0)}% of total`}
                        changeType="positive"
                    />
                    <StatCard
                        icon={UserX}
                        label="Offline"
                        value={offlinePlayers}
                        change={`Last seen recently`}
                        changeType="neutral"
                    />
                    <StatCard
                        icon={Activity}
                        label="Server Status"
                        value={onlinePlayers > 0 ? "Active" : "Idle"}
                        change={onlinePlayers > 0 ? "Players connected" : "No activity"}
                        changeType={onlinePlayers > 0 ? "positive" : "neutral"}
                    />
                </div>

                {/* Players Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <PlayerTable
                        rows={players}
                        onMute={handleMute}
                        onKick={handleKick}
                        onTeleport={handleTeleport}
                        isLoading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
