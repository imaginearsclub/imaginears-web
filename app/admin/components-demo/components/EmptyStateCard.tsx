import { Card, CardHeader, CardTitle, CardDescription, CardContent, EmptyState } from "@/components/common";
import { FileText } from "lucide-react";

export function EmptyStateCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empty State</CardTitle>
        <CardDescription>Beautiful no-data displays</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No documents yet"
          description="Get started by creating your first document."
          action={<button className="btn btn-primary">Create Document</button>}
        />
      </CardContent>
    </Card>
  );
}

