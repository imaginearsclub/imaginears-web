type Row = {
    time: string;
    user: string;
    action: string;
    details: string;
};

export default function ActivityTable({ rows }: { rows: Row[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Details</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition">
                        <td className="py-2 pr-4">{r.time}</td>
                        <td className="py-2 pr-4 font-medium">{r.user}</td>
                        <td className="py-2 pr-4">{r.action}</td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{r.details}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
