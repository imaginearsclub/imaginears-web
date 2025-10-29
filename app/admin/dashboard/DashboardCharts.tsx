import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { CalendarRange, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@/components/common";

interface DashboardChartsProps {
    events30d: { date: string; count: number }[];
    appsByStatus: { status: string; count: number }[];
}

export function DashboardCharts({ events30d, appsByStatus }: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Area chart: Events last 30 days */}
            <Card 
                className="lg:col-span-3 animate-in fade-in duration-300" 
                accent="purple" 
                variant="elevated"
            >
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Events (last 30 days)</span>
                        <Badge variant="info">Trend</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {events30d.length === 0 ? (
                        <EmptyState
                            icon={<CalendarRange className="w-12 h-12" />}
                            title="No event data"
                            description="Event statistics will appear here once you create events."
                        />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={events30d} margin={{ left: 8, right: 8 }}>
                                    <defs>
                                        <linearGradient id="evGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--brand-end)" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="var(--brand-end)" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ background: "var(--bg-light)", border: "1px solid rgba(148,163,184,.35)", borderRadius: "12px" }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="var(--brand-end)" strokeWidth={2} fill="url(#evGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bar chart: Applications by Status */}
            <Card 
                className="lg:col-span-2 animate-in fade-in duration-300" 
                accent="primary" 
                variant="elevated"
            >
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Applications</span>
                        <Badge variant="primary">By Status</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {appsByStatus.length === 0 ? (
                        <EmptyState
                            icon={<FileText className="w-12 h-12" />}
                            title="No applications yet"
                            description="Application statistics will appear here."
                        />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={appsByStatus} margin={{ left: 8, right: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                    <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ background: "var(--bg-light)", border: "1px solid rgba(148,163,184,.35)", borderRadius: "12px" }}
                                        labelStyle={{ fontWeight: 600 }}
                                    />
                                    <Bar dataKey="count" fill="var(--brand-end)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

