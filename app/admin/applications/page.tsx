"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/common";
import ApplicationTable, {
    exportApplicationsCSV,
} from "@/components/admin/applications/ApplicationTable";
import EditApplicationDrawer, {
    type EditableApplication,
} from "@/components/admin/applications/EditApplicationDrawer";
import { useApplications } from "./useApplications";
import { createHandlers } from "./handlers";
import { Toolbar } from "./Toolbar";

export default function AdminApplicationsPage() {
    const {
        rows,
        setRows,
        loading,
        error,
        q,
        setQ,
        status,
        setStatus,
        load,
        byId,
        updateRowLocal,
        patch,
    } = useApplications();

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

    const {
        handleChangeStatus,
        handleChangeRole,
        handleDelete,
        handleBulkChangeStatus,
    } = createHandlers(patch, updateRowLocal, setRows);

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
                    onClick={() => exportApplicationsCSV(rows)}
                    leftIcon={<Download />}
                    ariaLabel="Export applications to CSV"
                >
                    Export CSV
                </Button>
                }
            />

            <Toolbar
                q={q}
                setQ={setQ}
                status={status ?? ""}
                setStatus={setStatus}
                loading={loading}
                error={error}
                onRefresh={load}
            />

            <ApplicationTable
                rows={rows}
                onEdit={(id) => setEditingId(id)}
                onOpenNotes={(id) => setEditingId(id)}
                onChangeStatus={handleChangeStatus}
                onChangeRole={handleChangeRole}
                onDelete={handleDelete}
                onExportCSV={() => exportApplicationsCSV(rows)}
                onBulkChangeStatus={handleBulkChangeStatus}
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
