"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge, Separator } from "@/components/common";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";

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

    const getStatusBadge = () => {
        switch (currentStatus) {
            case "Approved":
                return <Badge variant="success">Approved</Badge>;
            case "Rejected":
                return <Badge variant="danger">Rejected</Badge>;
            case "InReview":
                return <Badge variant="warning">In Review</Badge>;
            case "New":
                return <Badge variant="default">New</Badge>;
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-40">
            <div className="mx-auto max-w-4xl">
                <div className={cn(
                    "m-4 rounded-xl p-4",
                    "border-2 border-slate-300 dark:border-slate-700",
                    "bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg",
                    "shadow-2xl"
                )}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Current status:
                            </span>
                            {getStatusBadge()}
                        </div>
                        
                        <Separator orientation="vertical" className="hidden sm:block h-8" />
                        
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    "bg-slate-100 dark:bg-slate-800",
                                    "text-slate-700 dark:text-slate-300",
                                    "hover:bg-slate-200 dark:hover:bg-slate-700",
                                    "border-2 border-transparent",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                )}
                                disabled={!!pending}
                                onClick={() => setStatus("InReview")}
                            >
                                {pending === "InReview" ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating…
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        In Review
                                    </>
                                )}
                            </button>
                            
                            <button
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    "bg-emerald-600 dark:bg-emerald-500",
                                    "text-white",
                                    "hover:bg-emerald-700 dark:hover:bg-emerald-600",
                                    "border-2 border-transparent",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                )}
                                disabled={!!pending}
                                onClick={() => setStatus("Approved")}
                            >
                                {pending === "Approved" ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Approving…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </>
                                )}
                            </button>
                            
                            <button
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    "bg-red-600 dark:bg-red-500",
                                    "text-white",
                                    "hover:bg-red-700 dark:hover:bg-red-600",
                                    "border-2 border-transparent",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                )}
                                disabled={!!pending}
                                onClick={() => setStatus("Rejected")}
                            >
                                {pending === "Rejected" ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Rejecting…
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
