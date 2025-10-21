"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid
} from "recharts";
import { CalendarRange, Users, FileText, Clock, CalendarCheck2, UserSquare2 } from "lucide-react";

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
            { title: "Total Players", value: kpis?.totalPlayers ?? "—", icon: <Users className="h-5 w-5 text-[var(--brand-end)]" /> },
            { title: "Total Events", value: kpis?.totalEvents ?? "—", icon: <CalendarRange className="h-5 w-5 text-[var(--brand-end)]" /> },
            { title: "Active Applications", value: kpis?.activeApplications ?? "—", icon: <FileText className="h-5 w-5 text-[var(--brand-end)]" /> },
            { title: "Server Uptime", value: kpis?.uptime ?? "—", icon: <Clock className="h-5 w-5 text-[var(--brand-end)]" /> },
        ],
        [kpis]
    );

    return (
        <section className="band">
            <div className="container py-6">
                <h1 className="section-title text-2xl md:text-3xl mb-4">Dashboard Overview</h1>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => (
                        <div key={card.title} className="card hover:shadow-lg transition-shadow">
                            <div className="card-content flex flex-col gap-2 p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">{card.title}</h3>
                                    {card.icon}
                                </div>
                                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Area chart: Events last 30 days */}
                    <div className="card lg:col-span-3">
                        <div className="card-content">
                            <h2 className="text-lg font-semibold mb-2">Events (last 30 days)</h2>
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
                        </div>
                    </div>

                    {/* Bar chart: Applications by Status */}
                    <div className="card lg:col-span-2">
                        <div className="card-content">
                            <h2 className="text-lg font-semibold mb-2">Applications by Status</h2>
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
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-6 card">
                    <div className="card-content">
                        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
                        {activity.length === 0 ? (
                            <p className="text-slate-600 dark:text-slate-400">No recent activity.</p>
                        ) : (
                            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                                {activity.map((item) => (
                                    <li key={`${item.kind}:${item.id}`} className="py-3 flex items-start gap-3">
                    <span
                        className={[
                            "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            item.kind === "event"
                                ? "bg-[var(--brand-start)]/10 text-[var(--brand-start)]"
                                : "bg-[var(--brand-end)]/10 text-[var(--brand-end)]",
                        ].join(" ")}
                        title={item.kind}
                    >
                      {item.kind === "event" ? <CalendarCheck2 className="h-4 w-4" /> : <UserSquare2 className="h-4 w-4" />}
                    </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-2">
                                                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">• {item.sub}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(item.when).toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Errors & loading */}
                {err && <div className="mt-4 rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{err}</div>}
                {loading && <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading fresh stats…</div>}
            </div>
        </section>
    );
}
