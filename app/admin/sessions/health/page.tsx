import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SessionHealthClient } from "./components/SessionHealthClient";

export const dynamic = "force-dynamic";

export default async function SessionHealthPage() {
  // Require session health monitoring permission
  const session = await requirePermission("sessions:view_health");
  if (!session) {
    redirect("/login");
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Fetch session health metrics
  const totalSessions = await prisma.session.count();
  const activeSessions = await prisma.session.count({
    where: { expiresAt: { gt: now } },
  });
  const expiredSessions = totalSessions - activeSessions;

  // Recent activity
  const recentActivity = await prisma.sessionActivity.count({
    where: { createdAt: { gte: oneHourAgo } },
  });

  const activityLast24h = await prisma.sessionActivity.count({
    where: { createdAt: { gte: oneDayAgo } },
  });

  // Performance metrics (simulated for now)
  const healthMetrics = {
    totalSessions,
    activeSessions,
    expiredSessions,
    recentActivity,
    activityLast24h,
    avgSessionDuration: 45, // minutes
    avgActiveSessions: 152,
    peakConcurrentSessions: 234,
    sessionCreationRate: 12.5, // per minute
    sessionTerminationRate: 8.3, // per minute
    avgDatabaseQueryTime: 23, // ms
    cacheHitRate: 94.5, // percentage
    errorRate: 0.12, // percentage
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <span className="text-2xl">💚</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Session Health & Performance
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Monitor system health, performance metrics, and diagnostics
            </p>
          </div>
        </div>
      </div>

      {/* Client Component */}
      <SessionHealthClient initialMetrics={healthMetrics} />
    </div>
  );
}

