export default function PlayersFilterBar({
                                             q, setQ,
                                             rank, setRank,
                                             onlineOnly, setOnlineOnly,
                                             reset
                                         }: {
    q: string; setQ: (v: string) => void;
    rank: "All" | "Member" | "Creator" | "Staff"; setRank: (v: "All" | "Member" | "Creator" | "Staff") => void;
    onlineOnly: boolean; setOnlineOnly: (v: boolean) => void;
    reset: () => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <input
                type="search"
                placeholder="Search player…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full sm:max-w-xs rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
            />

            <select
                value={rank}
                onChange={(e) => setRank(e.target.value as any)}
                className="rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
            >
                <option>All</option>
                <option>Member</option>
                <option>Creator</option>
                <option>Staff</option>
            </select>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                    type="checkbox"
                    checked={onlineOnly}
                    onChange={(e) => setOnlineOnly(e.target.checked)}
                    className="accent-brandEnd"
                />
                Online only
            </label>

            <div className="sm:ml-auto">
                <button type="button" onClick={reset} className="btn-gradient px-4 py-3">
                    Reset
                </button>
            </div>
        </div>
    );
}
