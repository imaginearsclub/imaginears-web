export default function ApplicationsFilterBar({
                                                  q, setQ,
                                                  role, setRole,
                                                  status, setStatus,
                                                  reset,
                                              }: {
    q: string; setQ: (v: string) => void;
    role: "All" | "Developer" | "Guest Services" | "Imaginear"; setRole: (v: any) => void;
    status: "All" | "Pending" | "Approved" | "Denied"; setStatus: (v: any) => void;
    reset: () => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <input
                type="search"
                placeholder="Search username, Discord, or ID…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full sm:max-w-xs rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
            />

            <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
            >
                <option>All</option>
                <option>Developer</option>
                <option>Guest Services</option>
                <option>Imaginear</option>
            </select>

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
            >
                <option>All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Denied</option>
            </select>

            <div className="sm:ml-auto">
                <button type="button" onClick={reset} className="btn-gradient px-4 py-3">
                    Reset
                </button>
            </div>
        </div>
    );
}
