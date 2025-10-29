import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/common";

interface PlayerActivityChartProps {
    playerHistory: { timestamp: number; count: number }[];
    online: boolean;
}

export function PlayerActivityChart({ playerHistory, online }: PlayerActivityChartProps) {
    return (
        <div className="lg:w-1/2">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Player Activity
                </p>
                <Badge variant="info" className="text-xs">
                    Last {playerHistory.length} checks
                </Badge>
            </div>
            
            {playerHistory.length > 0 ? (
                <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                            data={playerHistory.map((point, idx) => ({
                                index: idx,
                                count: point.count,
                            }))}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="playerGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={online ? "#10b981" : "#ef4444"} stopOpacity={0.8} />
                                    <stop offset="100%" stopColor={online ? "#10b981" : "#ef4444"} stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                className="stroke-slate-200 dark:stroke-slate-700" 
                                vertical={false}
                            />
                            <XAxis dataKey="index" hide />
                            <YAxis 
                                allowDecimals={false} 
                                tick={{ fontSize: 11 }}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ 
                                    background: "var(--bg-light)", 
                                    border: "1px solid rgba(148,163,184,.35)", 
                                    borderRadius: "8px",
                                    fontSize: "12px"
                                }}
                                labelFormatter={() => "Players"}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke={online ? "#10b981" : "#ef4444"}
                                strokeWidth={2} 
                                fill="url(#playerGradient)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Collecting player data...
                    </p>
                </div>
            )}
        </div>
    );
}

