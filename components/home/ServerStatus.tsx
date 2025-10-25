"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Server, Users, Wifi, WifiOff, Zap } from "lucide-react";
import { Skeleton } from "@/components/common";

type ServerStatusData = {
    online: boolean;
    players: {
        online: number;
        max: number;
    };
    version?: string;
    latency?: number;
    uptime?: number | null;
    serverAddress: string;
};

export default function ServerStatus() {
    const [status, setStatus] = useState<ServerStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch("/api/server-status");
                const result = await response.json();
                
                if (result.success) {
                    setStatus(result.data);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("[ServerStatus] Failed to fetch:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchStatus();

        // Refresh every minute
        const interval = setInterval(fetchStatus, 60000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <ServerStatusSkeleton />;
    }

    if (error || !status) {
        return null; // Don't show if error
    }

    return (
        <div className={cn(
            "rounded-2xl border-2 p-6 shadow-lg transition-all duration-300",
            "bg-gradient-to-br from-white to-slate-50",
            "dark:from-slate-900 dark:to-slate-950",
            status.online
                ? "border-green-300 dark:border-green-700"
                : "border-slate-300 dark:border-slate-700"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                        status.online
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-slate-100 dark:bg-slate-800"
                    )}>
                        <Server className={cn(
                            "w-6 h-6",
                            status.online
                                ? "text-green-600 dark:text-green-400"
                                : "text-slate-400 dark:text-slate-600"
                        )} aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Server Status
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {status.serverAddress}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm",
                    status.online
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}>
                    {status.online ? (
                        <>
                            <Wifi className="w-4 h-4" aria-hidden="true" />
                            Online
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4" aria-hidden="true" />
                            Offline
                        </>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Players Online */}
                <div className={cn(
                    "rounded-xl p-4 transition-all duration-300",
                    "bg-blue-50 dark:bg-blue-900/20",
                    "border-2 border-blue-200 dark:border-blue-800"
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Players
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {status.players.online}
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                            /{status.players.max}
                        </span>
                    </div>
                </div>

                {/* Version */}
                {status.version && (
                    <div className={cn(
                        "rounded-xl p-4 transition-all duration-300",
                        "bg-purple-50 dark:bg-purple-900/20",
                        "border-2 border-purple-200 dark:border-purple-800"
                    )}>
                        <div className="flex items-center gap-2 mb-2">
                            <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                Version
                            </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {status.version}
                        </div>
                    </div>
                )}

                {/* Latency */}
                {status.latency !== undefined && (
                    <div className={cn(
                        "rounded-xl p-4 transition-all duration-300",
                        "bg-amber-50 dark:bg-amber-900/20",
                        "border-2 border-amber-200 dark:border-amber-800"
                    )}>
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                Latency
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {status.latency}
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">ms</span>
                        </div>
                    </div>
                )}

                {/* Uptime */}
                {status.uptime !== null && status.uptime !== undefined && (
                    <div className={cn(
                        "rounded-xl p-4 transition-all duration-300",
                        "bg-green-50 dark:bg-green-900/20",
                        "border-2 border-green-200 dark:border-green-800"
                    )}>
                        <div className="flex items-center gap-2 mb-2">
                            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                Uptime
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {status.uptime}
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer note */}
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-500 text-center">
                Updates every minute
            </div>
        </div>
    );
}

function ServerStatusSkeleton() {
    return (
        <div className={cn(
            "rounded-2xl border-2 p-6 shadow-lg",
            "bg-gradient-to-br from-white to-slate-50",
            "dark:from-slate-900 dark:to-slate-950",
            "border-slate-300 dark:border-slate-700"
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-xl p-4 bg-slate-100 dark:bg-slate-800">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}

