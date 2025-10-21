export default function KPICard({
                                    label,
                                    value,
                                    delta,
                                    children,
                                }: {
    label: string;
    value: number | string;
    delta: string;
    children?: React.ReactNode; // sparkline
}) {
    const up = delta.trim().startsWith("+");
    const down = delta.trim().startsWith("−") || delta.trim().startsWith("-");
    const badgeColor = up ? "bg-emerald-500" : down ? "bg-rose-500" : "bg-slate-400";

    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="muted text-xs uppercase tracking-wide">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold">{value}</p>
                </div>
                <span className={`text-[10px] text-white px-2 py-1 rounded-full ${badgeColor}`}>
          {delta}
        </span>
            </div>
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}
