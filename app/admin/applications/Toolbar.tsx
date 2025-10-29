import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/common";

import type { AppStatus } from "@/components/admin/applications/ApplicationTable";

type Status = AppStatus | "";

interface ToolbarProps {
    q: string;
    setQ: (_q: string) => void;
    status: Status;
    setStatus: (_status: Status) => void;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}

export function Toolbar({
    q,
    setQ,
    status,
    setStatus,
    loading,
    error,
    onRefresh,
}: ToolbarProps) {
    return (
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
                onChange={(e) => setStatus((e.target.value as Status) ?? "")}
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
                onClick={onRefresh} 
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
    );
}

