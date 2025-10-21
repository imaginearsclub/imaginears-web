import RowActions from "@/components/admin/RowActions";

export type Player = {
    name: string;
    rank: "Member" | "Creator" | "Staff";
    world: string;
    online: boolean;
    joinedAt: string; // YYYY-MM-DD
};

export default function PlayerTable({
                                        rows,
                                        onMute,
                                        onKick,
                                        onTeleport,
                                    }: {
    rows: Player[];
    onMute: (name: string) => void;
    onKick: (name: string) => void;
    onTeleport: (name: string) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">World</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Joined</th>
                    <th className="py-2 pr-0 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                {rows.map((r) => (
                    <tr key={r.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition">
                        <td className="py-2 pr-4 font-medium">{r.name}</td>
                        <td className="py-2 pr-4">
                <span className={`px-2 py-1 rounded-full text-xs
                  ${r.rank === "Staff" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : r.rank === "Creator" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"}`}>
                  {r.rank}
                </span>
                        </td>
                        <td className="py-2 pr-4">{r.world}</td>
                        <td className="py-2 pr-4">
                <span className={`inline-flex items-center gap-2`}>
                  <span className={`h-2 w-2 rounded-full ${r.online ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {r.online ? "Online" : "Offline"}
                </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{r.joinedAt}</td>
                        <td className="py-2 pl-4 pr-0">
                            <div className="flex justify-end">
                                <RowActions
                                    name={r.name}
                                    online={r.online}
                                    onMute={() => onMute(r.name)}
                                    onKick={() => onKick(r.name)}
                                    onTeleport={() => onTeleport(r.name)}
                                />
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
