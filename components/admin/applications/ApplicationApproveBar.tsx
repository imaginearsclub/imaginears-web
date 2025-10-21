"use client";

import { useState } from "react";

export default function ActionBar({
                                      id,
                                      currentStatus,
                                  }: {
    id: string;
    currentStatus: "New" | "InReview" | "Approved" | "Rejected";
}) {
    const [pending, setPending] = useState<null | "InReview" | "Approved" | "Rejected">(null);

    async function setStatus(status: "InReview" | "Approved" | "Rejected") {
        try {
            setPending(status);
            const res = await fetch(`/api/admin/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed");
            // Simple UX: refresh to reflect new status
            window.location.reload();
        } catch {
            alert("Failed to update status.");
        } finally {
            setPending(null);
        }
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto max-w-4xl">
                <div className="m-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 flex items-center justify-between">
                    <div className="text-sm">
                        Current status: <strong>{currentStatus}</strong>
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
