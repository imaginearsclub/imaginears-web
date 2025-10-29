import { useEffect, useState } from "react";
import type { AdminEventRow } from "@/components/admin/EventsTable";
import type { EditableEvent } from "@/components/admin/events/EditEventDrawer";

function toLocalInputValue(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapRowToEditableEvent(r: AdminEventRow): EditableEvent {
    return {
        id: r.id,
        title: r.title,
        world: r.server,
        category: r.category as EditableEvent["category"],
        visibility: r.visibility || "PUBLIC",
        details: r.details ?? "",
        shortDescription: r.shortDescription ?? "",
        startAt: toLocalInputValue(r.startAt),
        endAt: toLocalInputValue(r.endAt),
        timezone: r.timezone || "America/New_York",
        recurrenceFreq: (r.recurrenceFreq || "NONE") as EditableEvent["recurrenceFreq"],
        byWeekday: (r.byWeekday || []) as EditableEvent["byWeekday"],
        times: r.times || [],
        recurrenceUntil: r.recurrenceUntil ? r.recurrenceUntil.slice(0, 10) : null,
    };
}

export function useEvents() {
    const [rows, setRows] = useState<AdminEventRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
                items.map((it: Record<string, unknown>) => ({
                    id: it['id'],
                    title: it['title'],
                    server: it['world'],
                    category: it['category'],
                    visibility: it['visibility'] || "PUBLIC",
                    status: it['status'],
                    startAt: it['startAt'],
                    endAt: it['endAt'],
                    timezone: it['timezone'] || "America/New_York",
                    recurrenceFreq: it['recurrenceFreq'] || "NONE",
                    byWeekday: Array.isArray(it['byWeekdayJson']) ? it['byWeekdayJson'] : [],
                    times: Array.isArray(it['timesJson']) ? it['timesJson'] : [],
                    recurrenceUntil: it['recurrenceUntil'] ?? null,
                    updatedAt: it['updatedAt'],
                    shortDescription: it['shortDescription'] as string | null,
                    details: it['details'] as string | null,
                }))
            );
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        } catch (e) {
            setRows([]);
            setErrorMsg("Failed to load events.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function openEditById(id: string) {
        const r = rows.find((x) => x.id === id);
        if (!r) return;
        setEditing(mapRowToEditableEvent(r));
        setEditOpen(true);
    }

    async function handleStatusChange(id: string, status: AdminEventRow["status"]) {
        await fetch(`/api/events/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    }

    function handleCreateSuccess() {
        setCreateOpen(false);
        load();
    }

    function handleEditSuccess() {
        setEditOpen(false);
        setEditing(null);
        load();
    }

    return {
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
    };
}

