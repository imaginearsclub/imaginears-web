import { Suspense } from "react";
import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/admin/PageHeader";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Admin",
  description: "Analytics and insights for Imaginears",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Insights and metrics for your platform • Real-time data"
        icon={<BarChart3 className="w-6 h-6" />}
        badge={{ label: "Live Data", variant: "success" }}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Analytics" }
        ]}
      />

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

