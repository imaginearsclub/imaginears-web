"use client";

import { useEffect, useMemo, useState } from "react";
import ApplicationTable, {
    ApplicationRow,
    exportApplicationsCSV,
} from "@/components/admin/applications/ApplicationTable";
import EditApplicationDrawer, {
    EditableApplication,
} from "@/components/admin/applications/EditApplicationDrawer";

type Query = {
    status?: "New" | "InReview" | "Approved" | "Rejected" | "";
    q?: string;
};

export default function AdminApplicationsPage() {
    const [rows, setRows] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<Query["status"]>("");

    const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (status) params.set("status", status);
            params.set("take", "100");
            const res = await fetch(`/api/admin/applications?${params.toString()}`, { cache: "no-store" });
            const data = await res.json();
            const items = (data.items || []) as any[];
            setRows(
                items.map((it) => ({
                    id: it.id,
                    name: it.name,
                    email: it.email,
                    role: it.role,
                    status: it.status,
                    submittedAt: it.createdAt,
                    notes: it.notes ?? "",
                }))
            );
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [editingId, setEditingId] = useState<string | null>(null);
    const editingApp: EditableApplication | null = editingId
        ? ({
            id: editingId,
            name: byId.get(editingId)?.name ?? "",
            email: byId.get(editingId)?.email ?? "",
            role: (byId.get(editingId)?.role ?? "Developer") as EditableApplication["role"],
            status: (byId.get(editingId)?.status ?? "New") as EditableApplication["status"],
            notes: byId.get(editingId)?.notes ?? "",
        } as EditableApplication)
        : null;

    function updateRowLocal(id: string, patch: Partial<ApplicationRow>) {
        setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    }

    async function patch(id: string, body: any) {
        const res = await fetch(`/api/admin/applications/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update");
        return res.json();
    }

    return (
        <div className="p-4 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="flex gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name, email, MC, Discord…"
                        className="rounded-2xl border px-4 py-2 w-64"
                    />
                    <select
                        value={status ?? ""}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="rounded-2xl border px-3 py-2"
                    >
                        <option value="">All statuses</option>
                        <option value="New">New</option>
                        <option value="InReview">In review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button className="btn btn-muted" onClick={load} disabled={loading}>
                        {loading ? "Loading…" : "Refresh"}
                    </button>
                </div>
            </div>

            <ApplicationTable
                rows={rows}
                onEdit={(id) => setEditingId(id)}
                onOpenNotes={(id) => setEditingId(id)}
                onChangeStatus={async (id, status) => {
                    try {
                        await patch(id, { status });
                        updateRowLocal(id, { status });
                    } catch (e) {
                        console.error(e);
                        alert("Failed to update status.");
                    }
                }}
                onChangeRole={async (id, role) => {
                    try {
                        await patch(id, { role });
                        updateRowLocal(id, { role });
                    } catch {
                        alert("Failed to update role.");
                    }
                }}
                onDelete={async (id) => {
                    if (!confirm("Delete this application?")) return;
                    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
                    if (!res.ok) return alert("Failed to delete.");
                    setRows((rs) => rs.filter((r) => r.id !== id));
                }}
                onExportCSV={() => exportApplicationsCSV(rows)}
                onBulkChangeStatus={async (ids, status) => {
                    try {
                        // parallel updates; in production, you could add a bulk endpoint
                        await Promise.all(ids.map((id) => patch(id, { status })));
                        setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
                    } catch (e) {
                        console.error(e);
                        alert("Failed to change status for some items.");
                    }
                }}
            />

            <EditApplicationDrawer
                open={!!editingId}
                app={editingApp}
                onOpenChange={(v) => !v && setEditingId(null)}
                onSave={async (updated) => {
                    try {
                        await patch(updated.id, {
                            name: updated.name,
                            email: updated.email,
                            role: updated.role,
                            status: updated.status,
                            notes: updated.notes ?? "",
                        });
                        updateRowLocal(updated.id, {
                            name: updated.name,
                            email: updated.email,
                            role: updated.role,
                            status: updated.status,
                            notes: updated.notes ?? "",
                        });
                    } catch (e) {
                        console.error(e);
                        alert("Failed to save changes.");
                    }
                }}
            />
        </div>
    );
}
