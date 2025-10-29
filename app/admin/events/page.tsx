"use client";

import EditEventDrawer from "@/components/admin/events/EditEventDrawer";
import CreateEventDrawer from "@/components/admin/events/CreateEventDrawer";
import { useEvents } from "./useEvents";
import { EventsHeader } from "./EventsHeader";
import { EventsViewTabs } from "./EventsViewTabs";

export default function AdminEventsPage() {
    const {
        rows,
        loading,
        errorMsg,
        load,
        editOpen,
        setEditOpen,
        editing,
        createOpen,
        setCreateOpen,
        openEditById,
        handleStatusChange,
        handleCreateSuccess,
        handleEditSuccess,
    } = useEvents();

    return (
        <div className="space-y-6">
            <EventsHeader
                eventCount={rows.length}
                loading={loading}
                onRefresh={load}
                onCreateClick={() => setCreateOpen(true)}
            />

            {errorMsg && (
                <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
                    {errorMsg}
                </div>
            )}

            <EventsViewTabs
                rows={rows}
                loading={loading}
                onEdit={openEditById}
                onStatusChange={handleStatusChange}
            />

            <CreateEventDrawer
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={handleCreateSuccess}
            />

            <EditEventDrawer
                open={editOpen}
                event={editing}
                onOpenChange={setEditOpen}
                onSaved={handleEditSuccess}
            />
        </div>
    );
}
