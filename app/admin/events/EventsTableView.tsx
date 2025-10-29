/* eslint-disable no-unused-vars */
import { Card, CardContent } from "@/components/common";
import EventsTable, { type AdminEventRow } from "@/components/admin/EventsTable";

interface EventsTableViewProps {
    rows: AdminEventRow[];
    loading: boolean;
    onEdit: (id: string) => void;
    onStatusChange: (id: string, status: AdminEventRow["status"]) => Promise<void>;
}

export function EventsTableView({ rows, loading, onEdit, onStatusChange }: EventsTableViewProps) {
    return (
        <Card accent="primary" variant="elevated">
            <CardContent className="p-0">
                <EventsTable
                    rows={rows}
                    onEdit={onEdit}
                    onStatusChange={onStatusChange}
                    isLoading={loading}
                />
            </CardContent>
        </Card>
    );
}

