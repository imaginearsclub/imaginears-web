import { Clock, CalendarCheck2, UserSquare2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from "@/components/common";
import type { ActivityItem } from "./useDashboard";

export function ActivityList({ activity }: { activity: ActivityItem[] }) {
    return (
        <Card 
            accent="info" 
            variant="elevated"
            className="animate-in fade-in duration-300"
        >
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Badge variant="info">{activity.length} items</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activity.length === 0 ? (
                    <EmptyState
                        icon={<Clock className="w-12 h-12" />}
                        title="No recent activity"
                        description="Activity will appear here as events and applications are created."
                    />
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                        {activity.map((item, idx) => (
                            <li key={`${item.kind}:${item.id}`} className="py-4 flex items-start gap-4">
                                <div
                                    className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                        item.kind === "event"
                                            ? "bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400"
                                            : "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                                    }`}
                                    title={item.kind}
                                >
                                    {item.kind === "event" ? (
                                        <CalendarCheck2 className="h-5 w-5" />
                                    ) : (
                                        <UserSquare2 className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {item.title}
                                        </p>
                                        <Badge variant={item.kind === "event" ? "primary" : "info"} className="text-xs">
                                            {item.kind}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                        {item.sub}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                            {new Date(item.when).toLocaleString()}
                                        </p>
                                        {item.updatedBy && (
                                            <>
                                                <span className="text-xs text-slate-400">•</span>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                    by {item.updatedBy}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {idx < 3 && <Badge variant="success" className="text-xs">New</Badge>}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

