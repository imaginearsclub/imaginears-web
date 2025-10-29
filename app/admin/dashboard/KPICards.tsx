import { useMemo } from "react";
import { Users, CalendarRange, FileText } from "lucide-react";
import { Card, CardContent, Badge } from "@/components/common";
import type { Kpi } from "./useDashboard";

export function KPICards({ kpis }: { kpis: Kpi | null }) {
    const cards = useMemo(
        () => [
            { 
                title: "Total Players", 
                value: kpis?.totalPlayers ?? "—", 
                icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
                trend: kpis?.trends?.players ?? "—",
                bgColor: "bg-blue-50 dark:bg-blue-950/30",
                ariaLabel: "Total players registered",
                accent: "primary" as const,
            },
            { 
                title: "Total Events", 
                value: kpis?.totalEvents ?? "—", 
                icon: <CalendarRange className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
                trend: kpis?.trends?.events ?? "—",
                bgColor: "bg-violet-50 dark:bg-violet-950/30",
                ariaLabel: "Total events created",
                accent: "purple" as const,
            },
            { 
                title: "Active Applications", 
                value: kpis?.activeApplications ?? "—", 
                icon: <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
                trend: kpis?.trends?.applications ?? "—",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
                ariaLabel: "Active application submissions",
                accent: "success" as const,
            },
        ],
        [kpis]
    );

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tour="kpi-cards">
            {cards.map((card) => (
                <Card 
                    key={card.title}
                    accent={card.accent}
                    variant="elevated"
                    interactive
                    aria-label={card.ariaLabel}
                >
                    <CardContent className="flex flex-col gap-3 p-6">
                        <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${card.bgColor} transition-transform hover:scale-110 duration-200`} aria-hidden="true">
                                {card.icon}
                            </div>
                            <Badge variant="info" ariaLabel={`7-day trend: ${card.trend}`}>
                                {card.trend}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.title}</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 transition-all duration-300">{card.value}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

