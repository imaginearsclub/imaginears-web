"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/common";
import ApplicationTable, {
    type ApplicationRow,
    exportApplicationsCSV,
} from "@/components/admin/applications/ApplicationTable";
import EditApplicationDrawer, {
    type EditableApplication,
} from "@/components/admin/applications/EditApplicationDrawer";

type Query = {
    status?: "New" | "InReview" | "Approved" | "Rejected" | "";
    q?: string;
};

export default function AdminApplicationsPage() {
    const [rows, setRows] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Raw inputs
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<Query["status"]>("");

    // Debounced inputs
    const [dq, setDQ] = useState("");
    const [dStatus, setDStatus] = useState<Query["status"]>("");

    // Track component mounted state and active fetch
    const mountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);
    const reqSeqRef = useRef(0);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Abort any in-flight request on unmount
            abortRef.current?.abort();
        };
    }, []);

    // Debounce query and status changes to avoid spamming the API
    useEffect(() => {
        const handle = setTimeout(() => {
            const trimmed = q.trim().slice(0, 200); // cap length for safety
            setDQ(trimmed);
            setDStatus(status ?? "");
        }, 300);
        return () => clearTimeout(handle);
    }, [q, status]);

    const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Abort previous request if any
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        // Sequence to avoid race conditions if responses return out of order
        const seq = ++reqSeqRef.current;

        try {
            const params = new URLSearchParams();
            if (dq) params.set("q", dq);
            if (dStatus) params.set("status", dStatus);
            params.set("take", "100");

            const res = await fetch(`/api/admin/applications?${params.toString()}`,
                { cache: "no-store", signal: controller.signal }
            );

            if (!res.ok) {
                let message = `Request failed (${res.status})`;
                try {
                    const text = await res.text();
                    if (text) message = text;
                } catch {}
                throw new Error(message);
            }

            const data = (await res.json()) as { items?: unknown[] };
            const items = Array.isArray(data.items) ? data.items : [];

            // Only apply if this is the latest request
            if (reqSeqRef.current === seq && mountedRef.current) {
                setRows(
                    items.map((it: any) => ({
                        id: it.id,
                        name: it.name,
                        email: it.email,
                        role: it.role,
                        status: it.status,
                        submittedAt: it.createdAt,
                        notes: it.notes ?? "",
                    }))
                );
            }
        } catch (e: any) {
            if (e?.name === "AbortError") return; // ignore aborted fetches
            console.error(e);
            if (mountedRef.current) setError(e?.message ?? "Failed to load applications.");
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [dq, dStatus]);

    // Initial load and refresh on debounced filters change
    useEffect(() => {
        load();
    }, [load]);

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

    async function patch(id: string, body: unknown) {
        try {
            const res = await fetch(`/api/admin/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                let message = `Failed to update (${res.status})`;
                try {
                    const text = await res.text();
                    if (text) message = text;
                } catch {}
                throw new Error(message);
            }
            return res.json();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Applications Management"
                description="Review and manage staff applications • Filter by status and search"
                icon={<FileText className="w-6 h-6" />}
                badge={{ label: `${rows.length} Applications`, variant: "info" }}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Applications" }
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => exportApplicationsCSV(rows, `applications-${new Date().toISOString().split('T')[0]}.csv`)}
                        leftIcon={<Download />}
                        ariaLabel="Export applications to CSV"
                    >
                        Export CSV
                    </Button>
                }
            />

            {/* Toolbar */}
            <div className={cn(
                "flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800",
                "items-stretch sm:items-center"
            )}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value.slice(0, 200))}
                    placeholder="Search name, email, MC, Discord…"
                    className={cn(
                        "flex-1 rounded-lg border px-4 py-2",
                        "border-slate-300 dark:border-slate-700",
                        "bg-white dark:bg-slate-900",
                        "text-slate-900 dark:text-white",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    )}
                    aria-label="Search applications"
                />
                <select
                    value={status ?? ""}
                    onChange={(e) => setStatus((e.target.value as Query["status"]) ?? "")}
                    className={cn(
                        "rounded-lg border px-3 py-2",
                        "border-slate-300 dark:border-slate-700",
                        "bg-white dark:bg-slate-900",
                        "text-slate-900 dark:text-white"
                    )}
                    aria-label="Filter by status"
                >
                    <option value="">All statuses</option>
                    <option value="New">New</option>
                    <option value="InReview">In review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <Button 
                    variant="outline"
                    onClick={load} 
                    isLoading={loading}
                    leftIcon={<RefreshCw />}
                    ariaLabel="Refresh applications list"
                >
                    Refresh
                </Button>
                {error && (
                    <div className="w-full text-sm text-red-600 dark:text-red-400" role="alert" aria-live="polite">
                        {error}
                    </div>
                )}
            </div>

            <ApplicationTable
                rows={rows}
                onEdit={(id) => setEditingId(id)}
                onOpenNotes={(id) => setEditingId(id)}
                onChangeStatus={async (id, status) => {
                    const updatePromise = (async () => {
                        await patch(id, { status });
                        updateRowLocal(id, { status });
                    })();

                    toast.promise(updatePromise, {
                        loading: "Updating status...",
                        success: "Status updated successfully!",
                        error: "Failed to update status",
                    });

                    try {
                        await updatePromise;
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onChangeRole={async (id, role) => {
                    const updatePromise = (async () => {
                        await patch(id, { role });
                        updateRowLocal(id, { role });
                    })();

                    toast.promise(updatePromise, {
                        loading: "Updating role...",
                        success: "Role updated successfully!",
                        error: "Failed to update role",
                    });

                    try {
                        await updatePromise;
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onDelete={async (id) => {
                    if (!confirm("Delete this application? This cannot be undone.")) return;
                    
                    const deletePromise = (async () => {
                        const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
                        if (!res.ok) {
                            let message = `Failed to delete (${res.status})`;
                            try {
                                const text = await res.text();
                                if (text) message = text;
                            } catch {}
                            throw new Error(message);
                        }
                        setRows((rs) => rs.filter((r) => r.id !== id));
                    })();

                    toast.promise(deletePromise, {
                        loading: "Deleting application...",
                        success: "Application deleted successfully!",
                        error: (err) => err.message || "Failed to delete",
                    });

                    try {
                        await deletePromise;
                    } catch (e) {
                        console.error(e);
                    }
                }}
                onExportCSV={() => exportApplicationsCSV(rows)}
                onBulkChangeStatus={async (ids, status) => {
                    const bulkPromise = (async () => {
                        await Promise.all(ids.map((id) => patch(id, { status })));
                        setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
                    })();

                    toast.promise(bulkPromise, {
                        loading: `Updating ${ids.length} application(s)...`,
                        success: `${ids.length} application(s) updated successfully!`,
                        error: "Failed to update some applications",
                    });

                    try {
                        await bulkPromise;
                    } catch (e) {
                        console.error(e);
                    }
                }}
            />

            <EditApplicationDrawer
                open={!!editingId}
                app={editingApp}
                onOpenChange={(v) => !v && setEditingId(null)}
                onSave={async (updated) => {
                    // Note: EditApplicationDrawer already shows toast notifications
                    // Just handle the API call and update local state
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
                }}
            />
        </div>
    );
}
