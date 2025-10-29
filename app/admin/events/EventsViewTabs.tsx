import type { ComponentProps } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/common";
import { NewFeatureBadge } from "@/components/onboarding/FeatureSpotlight";
import { Calendar, Table } from "lucide-react";
import { EventsTableView } from "./EventsTableView";
import { EventsCalendarTab } from "./EventsCalendarTab";
import type { AdminEventRow } from "@/components/admin/EventsTable";

interface EventsViewTabsProps {
    rows: AdminEventRow[];
    loading: boolean;
    onEdit: ComponentProps<typeof EventsTableView>["onEdit"];
    onStatusChange: ComponentProps<typeof EventsTableView>["onStatusChange"];
}

export function EventsViewTabs({ rows, loading, onEdit, onStatusChange }: EventsViewTabsProps) {
    return (
        <Tabs defaultValue="table" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="table" className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Table View
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2" data-tour="events-table">
                    <Calendar className="w-4 h-4" />
                    Calendar View
                    <NewFeatureBadge featureId="events-calendar-view" />
                </TabsTrigger>
            </TabsList>

            <TabsContent value="table">
                <EventsTableView
                    rows={rows}
                    loading={loading}
                    onEdit={onEdit}
                    onStatusChange={onStatusChange}
                />
            </TabsContent>

            <TabsContent value="calendar">
                <EventsCalendarTab
                    rows={rows}
                    onEventClick={onEdit}
                />
            </TabsContent>
        </Tabs>
    );
}

