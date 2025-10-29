import { Suspense, memo } from "react";
import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { Skeleton } from "@/components/common/Skeleton";
import { PageHeader } from "@/components/admin/PageHeader";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics Dashboard | Admin",
  description: "Analytics and insights for Imaginears",
};

// Move outside component to avoid recreation on every render
const SKELETON_CARDS = ['card-1', 'card-2', 'card-3', 'card-4'] as const;

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

// Memoize loading component to prevent unnecessary re-renders
const AnalyticsLoading = memo(function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {SKELETON_CARDS.map((id) => (
          <Skeleton key={id} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
});

