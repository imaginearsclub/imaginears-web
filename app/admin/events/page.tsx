"use client";

import { useEffect, useState } from "react";
import EditEventDrawer, { type EditableEvent } from "@/components/admin/events/EditEventDrawer";
import CreateEventDrawer from "@/components/admin/events/CreateEventDrawer";
import EventsTable, { type AdminEventRow } from "@/components/admin/EventsTable";
import { Button, Card, CardContent } from "@/components/common";
import { Calendar, Plus, RefreshCw } from "lucide-react";

export default function AdminEventsPage() {
    const [rows, setRows] = useState<AdminEventRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Drawers
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<EditableEvent | null>(null);

    const [createOpen, setCreateOpen] = useState(false);

    async function load() {
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch("/api/admin/events?take=200", { 
                cache: "no-store",
                credentials: "include"
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json().catch(() => ({}));
            const items = Array.isArray(data.items) ? data.items : [];

            setRows(
                items.map((it: any) => ({
                    id: it.id,
                    title: it.title,
                    server: it.world,
                    category: it.category,
                    status: it.status,
                    startAt: it.startAt,
                    endAt: it.endAt,
                    timezone: it.timezone || "America/New_York",
                    recurrenceFreq: it.recurrenceFreq || "NONE",
                    byWeekday: Array.isArray(it.byWeekdayJson) ? it.byWeekdayJson : [],
                    times: Array.isArray(it.timesJson) ? it.timesJson : [],
                    recurrenceUntil: it.recurrenceUntil ?? null,
                    updatedAt: it.updatedAt,
                    shortDescription: it.shortDescription ?? null,
                    details: it.details ?? null,
                }))
            );
        } catch (e) {
            console.error("Load events failed:", e);
            setRows([]); // keep array to avoid .map crash
            setErrorMsg("Failed to load events.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function toLocalInputValue(iso: string) {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function openEditById(id: string) {
        const r = rows.find((x) => x.id === id);
        if (!r) return;
        const ev: EditableEvent = {
            id: r.id,
            title: r.title,
            world: r.server,
            category: r.category as any,
            details: r.details ?? "",
            shortDescription: r.shortDescription ?? "",
            startAt: toLocalInputValue(r.startAt),
            endAt: toLocalInputValue(r.endAt),
            timezone: r.timezone || "America/New_York",
            recurrenceFreq: (r.recurrenceFreq || "NONE") as any,
            byWeekday: (r.byWeekday || []) as any,
            times: r.times || [],
            recurrenceUntil: r.recurrenceUntil ? r.recurrenceUntil.slice(0, 10) : null,
        };
        setEditing(ev);
        setEditOpen(true);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Events
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            Manage server events, schedules, and recurring activities
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="md"
                        onClick={load} 
                        isLoading={loading}
                        loadingText="Refreshing..."
                        leftIcon={<RefreshCw />}
                        ariaLabel="Refresh events list"
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="primary" 
                        size="md"
                        onClick={() => setCreateOpen(true)}
                        leftIcon={<Plus />}
                        ariaLabel="Create new event"
                    >
                        Create Event
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                    {errorMsg}
                </div>
            )}

            {/* Events Table Card */}
            <Card accent="primary" variant="elevated">
                <CardContent className="p-0">
                    <EventsTable
                        rows={rows}
                        onEdit={openEditById}
                        onStatusChange={async (id, status) => {
                            await fetch(`/api/events/${id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status }),
                            });
                            setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
                        }}
                        isLoading={loading}
                    />
                </CardContent>
            </Card>

            {/* Create Drawer */}
            <CreateEventDrawer
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={() => {
                    setCreateOpen(false);
                    load();
                }}
            />

            {/* Edit Drawer */}
            <EditEventDrawer
                open={editOpen}
                event={editing}
                onOpenChange={(v) => setEditOpen(v)}
                onSaved={() => {
                    setEditOpen(false);
                    setEditing(null);
                    load();
                }}
            />
        </div>
    );
}
