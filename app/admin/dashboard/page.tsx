"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid
} from "recharts";
import { CalendarRange, Users, FileText, Clock, CalendarCheck2, UserSquare2, TrendingUp } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Alert,
    Spinner,
    EmptyState,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/common";

type Kpi = { totalPlayers: number; totalEvents: number; activeApplications: number; uptime: string };
type ActivityItem = { id: string; kind: "event" | "application"; title: string; sub: string; when: string };

export default function DashboardPage() {
    const [kpis, setKpis] = useState<Kpi | null>(null);
    const [events30d, setEvents30d] = useState<{ date: string; count: number }[]>([]);
    const [appsByStatus, setAppsByStatus] = useState<{ status: string; count: number }[]>([]);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const [k, e, a, act] = await Promise.all([
                    fetch("/api/admin/kpis").then(r => r.json()),
                    fetch("/api/admin/stats/events?range=30").then(r => r.json()),
                    fetch("/api/admin/stats/applications-by-status").then(r => r.json()),
                    fetch("/api/admin/activity").then(r => r.json()),
                ]);
                setKpis(k);
                setEvents30d(Array.isArray(e) ? e : []);
                setAppsByStatus(Array.isArray(a) ? a : []);
                setActivity(Array.isArray(act) ? act : []);
            } catch {
                setErr("Failed to load stats.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const cards = useMemo(
        () => [
            { 
                title: "Total Players", 
                value: kpis?.totalPlayers ?? "—", 
                icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
                trend: "+12%",
                bgColor: "bg-blue-50 dark:bg-blue-950/30"
            },
            { 
                title: "Total Events", 
                value: kpis?.totalEvents ?? "—", 
                icon: <CalendarRange className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
                trend: "+8%",
                bgColor: "bg-violet-50 dark:bg-violet-950/30"
            },
            { 
                title: "Active Applications", 
                value: kpis?.activeApplications ?? "—", 
                icon: <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
                trend: "+23%",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
            },
            { 
                title: "Server Uptime", 
                value: kpis?.uptime ?? "—", 
                icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
                trend: "99.9%",
                bgColor: "bg-amber-50 dark:bg-amber-950/30"
            },
        ],
        [kpis]
    );

    return (
        <section className="band">
            <div className="container py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="section-title text-2xl md:text-3xl mb-2">Dashboard Overview</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Real-time insights into your community
                        </p>
                    </div>
                    <Badge variant="success" className="hidden sm:inline-flex">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Live
                    </Badge>
                </div>

                {/* Loading State */}
                {loading && !kpis && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-3">
                            <Spinner size="lg" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {err && (
                    <Alert variant="error" dismissible onDismiss={() => setErr(null)}>
                        <strong>Error:</strong> {err}
                    </Alert>
                )}

                {/* KPI Cards */}
                {kpis && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {cards.map((card) => (
                            <Card key={card.title} className="hover:shadow-lg transition-shadow">
                                <CardContent className="flex flex-col gap-3 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                            {card.icon}
                                        </div>
                                        <Badge variant="default" className="text-xs">
                                            {card.trend}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.title}</p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{card.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Charts */}
                {kpis && (
                    <Tabs defaultValue="charts" className="w-full">
                        <TabsList>
                            <TabsTrigger value="charts">Analytics</TabsTrigger>
                            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                        </TabsList>

                        <TabsContent value="charts" className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* Area chart: Events last 30 days */}
                                <Card className="lg:col-span-3">
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
                                <Card className="lg:col-span-2">
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
                        </TabsContent>

                        <TabsContent value="activity">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {activity.length === 0 ? (
                                        <EmptyState
                                            icon={<Clock className="w-12 h-12" />}
                                            title="No recent activity"
                                            description="Activity will appear here as events and applications are created."
                                        />
                                    ) : (
                                        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {activity.map((item, idx) => (
                                                <li key={`${item.kind}:${item.id}`} className="py-4 flex items-start gap-4">
                                                    <div
                                                        className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                            item.kind === "event"
                                                                ? "bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400"
                                                                : "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                                                        }`}
                                                        title={item.kind}
                                                    >
                                                        {item.kind === "event" ? (
                                                            <CalendarCheck2 className="h-5 w-5" />
                                                        ) : (
                                                            <UserSquare2 className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                {item.title}
                                                            </p>
                                                            <Badge variant={item.kind === "event" ? "primary" : "info"} className="text-xs">
                                                                {item.kind}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                            {item.sub}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                                            {new Date(item.when).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {idx < 3 && <Badge variant="success" className="text-xs">New</Badge>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Quick Actions */}
                {kpis && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <a href="/admin/events" className="btn btn-primary justify-center">
                                    <CalendarRange className="w-4 h-4" />
                                    View Events
                                </a>
                                <a href="/admin/applications" className="btn btn-muted justify-center">
                                    <FileText className="w-4 h-4" />
                                    View Applications
                                </a>
                                <a href="/admin/players" className="btn btn-muted justify-center">
                                    <Users className="w-4 h-4" />
                                    View Players
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </section>
    );
}
