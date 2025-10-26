import { Suspense } from "react";
import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Skeleton } from "@/components/common/Skeleton";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Admin",
  description: "Analytics and insights for Imaginears",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Insights and metrics for your platform
        </p>
      </div>

      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

