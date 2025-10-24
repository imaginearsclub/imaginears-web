"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ActionBar({
                                      id,
                                      currentStatus,
                                  }: {
    id: string;
    currentStatus: "New" | "InReview" | "Approved" | "Rejected";
}) {
    const [pending, setPending] = useState<null | "InReview" | "Approved" | "Rejected">(null);

    async function setStatus(status: "InReview" | "Approved" | "Rejected") {
        setPending(status);

        const statusLabels = {
            InReview: "In Review",
            Approved: "Approved",
            Rejected: "Rejected",
        };

        const updatePromise = (async () => {
            const res = await fetch(`/api/admin/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            // Reload to reflect new status
            window.location.reload();
        })();

        toast.promise(updatePromise, {
            loading: `Updating to ${statusLabels[status]}...`,
            success: `Status updated to ${statusLabels[status]}!`,
            error: "Failed to update status",
        });

        try {
            await updatePromise;
        } finally {
            setPending(null);
        }
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto max-w-4xl">
                <div className={cn(
                    "m-4 rounded-2xl p-3",
                    "border border-slate-200 dark:border-slate-800",
                    "bg-white/90 dark:bg-slate-900/90 backdrop-blur",
                    "flex items-center justify-between",
                    "shadow-lg"
                )}>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        Current status: <strong className="text-slate-900 dark:text-white">{currentStatus}</strong>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-muted btn-sm"
                            disabled={pending === "InReview"}
                            onClick={() => setStatus("InReview")}
                        >
                            {pending === "InReview" ? "Updating…" : "Mark In Review"}
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            disabled={pending === "Approved"}
                            onClick={() => setStatus("Approved")}
                        >
                            {pending === "Approved" ? "Approving…" : "Approve"}
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            disabled={pending === "Rejected"}
                            onClick={() => setStatus("Rejected")}
                        >
                            {pending === "Rejected" ? "Rejecting…" : "Reject"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
