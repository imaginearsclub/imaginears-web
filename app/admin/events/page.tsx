"use client";

import { useEffect, useState } from "react";
import EditEventDrawer, { type EditableEvent } from "@/components/admin/events/EditEventDrawer";
import CreateEventDrawer from "@/components/admin/events/CreateEventDrawer";
import EventsTable, { type AdminEventRow } from "@/components/admin/EventsTable";
import EventsCalendarView from "@/components/admin/events/EventsCalendarView";
import { Button, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { NewFeatureBadge } from "@/components/onboarding/FeatureSpotlight";
import { Calendar, Plus, RefreshCw, Table } from "lucide-react";

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
                    visibility: it.visibility || "PUBLIC",
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
            visibility: r.visibility || "PUBLIC",
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
            <PageHeader
                title="Events Management"
                description="Manage server events, schedules, and recurring activities"
                icon={<Calendar className="w-6 h-6" />}
                badge={{ label: `${rows.length} Events`, variant: "info" }}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Events" }
                ]}
                actions={
                    <>
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
                    </>
                }
            />

            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                    {errorMsg}
                </div>
            )}

            {/* Events Views */}
            <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="table" className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        Table View
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-2" data-tour="events-table">
                        <Calendar className="w-4 h-4" />
                        Calendar View
                        <NewFeatureBadge featureId="events-calendar-view" />
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="table">
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
                </TabsContent>

                <TabsContent value="calendar">
                    <EventsCalendarView
                        events={rows.map(r => ({
                            id: r.id,
                            title: r.title,
                            startAt: r.startAt,
                            endAt: r.endAt,
                            category: r.category,
                            status: r.status as any,
                            visibility: r.visibility || "PUBLIC",
                            recurrenceFreq: r.recurrenceFreq || "NONE",
                            byWeekdayJson: r.byWeekday || [],
                            timesJson: r.times || [],
                            timezone: r.timezone || null,
                            recurrenceUntil: r.recurrenceUntil || null,
                        }))}
                        onEventClick={openEditById}
                    />
                </TabsContent>
            </Tabs>

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
