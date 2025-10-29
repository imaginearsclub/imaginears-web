import { Button } from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { Calendar, Plus, RefreshCw } from "lucide-react";

interface EventsHeaderProps {
    eventCount: number;
    loading: boolean;
    onRefresh: () => void;
    onCreateClick: () => void;
}

export function EventsHeader({ eventCount, loading, onRefresh, onCreateClick }: EventsHeaderProps) {
    return (
        <PageHeader
            title="Events Management"
            description="Manage server events, schedules, and recurring activities"
            icon={<Calendar className="w-6 h-6" />}
            badge={{ label: `${eventCount} Events`, variant: "info" }}
            breadcrumbs={[
                { label: "Dashboard", href: "/admin/dashboard" },
                { label: "Events" }
            ]}
            actions={
                <>
                    <Button 
                        variant="outline" 
                        size="md"
                        onClick={onRefresh} 
                        isLoading={loading}
                        loadingText="Refreshing..."
                        leftIcon={<RefreshCw />}
                        ariaLabel="Refresh events list"
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="primary" 
                        size="md"
                        onClick={onCreateClick}
                        leftIcon={<Plus />}
                        ariaLabel="Create new event"
                    >
                        Create Event
                    </Button>
                </>
            }
        />
    );
}

