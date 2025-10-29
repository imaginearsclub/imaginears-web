import { CalendarRange, Users, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common";

export function QuickActions() {
    return (
        <Card 
            variant="elevated" 
            data-tour="quick-actions"
            className="animate-in fade-in duration-500"
        >
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <a 
                        href="/admin/events" 
                        className="btn btn-primary justify-center"
                        aria-label="Navigate to events management page"
                    >
                        <CalendarRange className="w-4 h-4" />
                        View Events
                    </a>
                    <a 
                        href="/admin/applications" 
                        className="btn btn-muted justify-center"
                        aria-label="Navigate to applications management page"
                    >
                        <FileText className="w-4 h-4" />
                        View Applications
                    </a>
                    <a 
                        href="/admin/players" 
                        className="btn btn-muted justify-center"
                        aria-label="Navigate to players management page"
                    >
                        <Users className="w-4 h-4" />
                        View Players
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}

