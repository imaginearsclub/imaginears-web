"use client";

import { LayoutDashboard } from "lucide-react";
import {
    Alert,
    Spinner,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useDashboard } from "./useDashboard";
import { KPICards } from "./KPICards";
import { ServerStatusCard } from "./ServerStatusCard";
import { DashboardCharts } from "./DashboardCharts";
import { ActivityList } from "./ActivityList";
import { QuickActions } from "./QuickActions";

export default function DashboardPage() {
    const { kpis, events30d, appsByStatus, activity, loading, err, setErr } = useDashboard();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div data-tour="dashboard-overview">
                <PageHeader
                    title="Dashboard Overview"
                    description="Real-time insights into your community • Auto-refreshes every 30s"
                    icon={<LayoutDashboard className="w-6 h-6" />}
                    badge={{ 
                        label: "Live", 
                        variant: "success" 
                    }}
                />
            </div>

            {/* Loading State */}
            {loading && !kpis && (
                <div className="flex items-center justify-center py-24 animate-in fade-in duration-300">
                    <div className="text-center space-y-4">
                        <Spinner size="lg" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {err && (
                <Alert variant="error" dismissible onDismiss={() => setErr(null)}>
                    <strong>Error:</strong> {err}
                </Alert>
            )}

            {/* KPI Cards */}
            {kpis && (
                <>
                    <KPICards kpis={kpis} />

                    {/* Onboarding Progress Widget */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                        <OnboardingProgress showDetails={true} />
                    </div>

                    {/* Server Status Card */}
                    <ServerStatusCard server={kpis.server} />
                </>
            )}

            {/* Charts & Activity */}
            {kpis && (
                <Tabs 
                    defaultValue="activity" 
                    className="w-full animate-in fade-in duration-500" 
                    data-tour="dashboard-tabs"
                >
                    <TabsList>
                        <TabsTrigger value="charts">Analytics</TabsTrigger>
                        <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="charts" className="space-y-6">
                        <DashboardCharts events30d={events30d} appsByStatus={appsByStatus} />
                    </TabsContent>

                    <TabsContent value="activity">
                        <ActivityList activity={activity} />
                    </TabsContent>
                    </Tabs>
                )}

            {/* Quick Actions */}
            {kpis && <QuickActions />}
        </div>
    );
}
