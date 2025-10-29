/* eslint-disable no-unused-vars */
import { toast } from "sonner";
import type { ApplicationRow } from "@/components/admin/applications/ApplicationTable";
import type { AppStatus, AppRole } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-unused-vars */
export function createHandlers(
    patch: (id: string, body: unknown) => Promise<unknown>,
    updateRowLocal: (id: string, patch: Partial<ApplicationRow>) => void,
    setRows: (updater: (rows: ApplicationRow[]) => ApplicationRow[]) => void
) {
/* eslint-enable @typescript-eslint/no-unused-vars */
    const handleChangeStatus = async (id: string, status: AppStatus) => {
        const updatePromise = (async () => {
            await patch(id, { status });
            updateRowLocal(id, { status });
        })();

        toast.promise(updatePromise, {
            loading: "Updating status...",
            success: "Status updated successfully!",
            error: "Failed to update status",
        });

        await updatePromise.catch(() => {
            // Error already handled by toast.promise
        });
    };

    const handleChangeRole = async (id: string, role: AppRole) => {
        const updatePromise = (async () => {
            await patch(id, { role });
            updateRowLocal(id, { role });
        })();

        toast.promise(updatePromise, {
            loading: "Updating role...",
            success: "Role updated successfully!",
            error: "Failed to update role",
        });

        await updatePromise.catch(() => {
            // Error already handled by toast.promise
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this application? This cannot be undone.")) return;

        const deletePromise = (async () => {
            const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
            if (!res.ok) {
                let message = `Failed to delete (${res.status})`;
                try {
                    const text = await res.text();
                    if (text) message = text;
                } catch {
                    // Ignore parse errors
                }
                throw new Error(message);
            }
            setRows((rs) => rs.filter((r) => r.id !== id));
        })();

        toast.promise(deletePromise, {
            loading: "Deleting application...",
            success: "Application deleted successfully!",
            error: (err) => err instanceof Error ? err.message : "Failed to delete",
        });

        await deletePromise.catch(() => {
            // Error already handled by toast.promise
        });
    };

    const handleBulkChangeStatus = async (ids: string[], status: AppStatus) => {
        const bulkPromise = (async () => {
            await Promise.all(ids.map((id) => patch(id, { status })));
            setRows((rs) => rs.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
        })();

        toast.promise(bulkPromise, {
            loading: `Updating ${ids.length} application(s)...`,
            success: `${ids.length} application(s) updated successfully!`,
            error: "Failed to update some applications",
        });

        await bulkPromise.catch(() => {
            // Error already handled by toast.promise
        });
    };

    return {
        handleChangeStatus,
        handleChangeRole,
        handleDelete,
        handleBulkChangeStatus,
    };
}

