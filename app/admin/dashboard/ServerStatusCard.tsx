import { Server } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/common";
import type { Kpi } from "./useDashboard";
import { ServerStats } from "./ServerStats";
import { PlayerActivityChart } from "./PlayerActivityChart";

export function ServerStatusCard({ server }: { server: Kpi["server"] }) {
    return (
        <Card 
            accent={server?.online ? "success" : "danger"}
            variant="elevated"
            className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                server?.online 
                    ? "bg-gradient-to-br from-green-50/30 to-transparent dark:from-green-950/10 dark:to-transparent" 
                    : "bg-gradient-to-br from-red-50/30 to-transparent dark:from-red-950/10 dark:to-transparent"
            }`}
            data-tour="server-status"
        >
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Server Info */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${
                                server?.online 
                                    ? "bg-green-100 dark:bg-green-950/30" 
                                    : "bg-red-100 dark:bg-red-950/30"
                            }`}>
                                <Server className={`h-6 w-6 ${
                                    server?.online 
                                        ? "text-green-600 dark:text-green-400" 
                                        : "text-red-600 dark:text-red-400"
                                }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {server?.address || "Minecraft Server"}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                        variant={server?.online ? "success" : "danger"}
                                        className="text-xs"
                                    >
                                        {server?.online ? "Online" : "Offline"}
                                    </Badge>
                                    {server?.version && (
                                        <span className="text-xs text-slate-600 dark:text-slate-400">
                                            {server.version}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <ServerStats
                            online={server?.online ?? false}
                            players={server?.players ?? { online: 0, max: 0 }}
                            latency={server?.latency}
                            uptimePercentage={server?.uptimePercentage ?? null}
                        />
                    </div>

                    {/* Right: Player Count Graph */}
                    <PlayerActivityChart
                        playerHistory={server?.playerHistory ?? []}
                        online={server?.online ?? false}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

