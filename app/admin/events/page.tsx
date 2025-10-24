"use client";

import { useEffect, useState } from "react";
import EditEventDrawer, { type EditableEvent } from "@/components/admin/events/EditEventDrawer";
import CreateEventDrawer from "@/components/admin/events/CreateEventDrawer";
import EventsTable, { type AdminEventRow } from "@/components/admin/EventsTable";

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
            const res = await fetch("/api/admin/events?take=200", { cache: "no-store" });
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
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Events</h1>
                <div className="flex gap-2">
                    {errorMsg && <span className="text-sm text-rose-600">{errorMsg}</span>}
                    <button className="btn btn-muted" onClick={load} disabled={loading}>
                        {loading ? "Loading…" : "Refresh"}
                    </button>
                    <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
                        + New Event
                    </button>
                </div>
            </div>

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
            />

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
