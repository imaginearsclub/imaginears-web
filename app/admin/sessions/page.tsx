import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { 
  Activity, 
  MapPin, 
  Monitor, 
  AlertTriangle, 
  Shield,
  TrendingUp,
  Clock,
  Globe
} from "lucide-react";
import { AdminSessionsClient } from "./components/AdminSessionsClient";
import { SessionTimeline } from "./components/SessionTimeline";
import { ThreatDetectionPanel } from "./components/ThreatDetectionPanel";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  // Require session viewing permission
  const session = await requirePermission("sessions:view_all");
  if (!session) {
    redirect("/login");
  }

  // Fetch system-wide session statistics
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total active sessions
  const totalActiveSessions = await prisma.session.count({
    where: {
      expiresAt: { gt: now },
    },
  });

  // Suspicious sessions
  const suspiciousSessions = await prisma.session.count({
    where: {
      isSuspicious: true,
      expiresAt: { gt: now },
    },
  });

  // Recent logins (last 24h)
  const recentLogins = await prisma.session.count({
    where: {
      createdAt: { gte: oneDayAgo },
    },
  });

  // Unique users with active sessions
  const uniqueActiveUsers = await prisma.session.groupBy({
    by: ['userId'],
    where: {
      expiresAt: { gt: now },
    },
  });

  // Device type breakdown
  const deviceBreakdown = await prisma.session.groupBy({
    by: ['deviceType'],
    where: {
      expiresAt: { gt: now },
    },
    _count: true,
  });

  // Geographic distribution (top 10 countries)
  const geoDistribution = await prisma.session.groupBy({
    by: ['country'],
    where: {
      expiresAt: { gt: now },
      country: { not: null },
    },
    _count: true,
    orderBy: {
      _count: {
        country: 'desc',
      },
    },
    take: 10,
  });

  // Trust level distribution
  const trustLevels = await prisma.session.groupBy({
    by: ['trustLevel'],
    where: {
      expiresAt: { gt: now },
    },
    _count: true,
  });

  // Recent suspicious activity
  const recentSuspicious = await prisma.session.findMany({
    where: {
      isSuspicious: true,
      createdAt: { gte: oneWeekAgo },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Session activity logs
  const recentActivity = await prisma.sessionActivity.findMany({
    where: {
      createdAt: { gte: oneDayAgo },
    },
    include: {
      session: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Activity breakdown
  const activityBreakdown = await prisma.sessionActivity.groupBy({
    by: ['action'],
    where: {
      createdAt: { gte: oneWeekAgo },
    },
    _count: true,
    orderBy: {
      _count: {
        action: 'desc',
      },
    },
    take: 10,
  });

  // Get users with session stats for the new client component
  const activeSessionsForUsers = await prisma.session.findMany({
    where: {
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      userId: true,
      isSuspicious: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    take: 500, // Limit to recent sessions
  });

  // Group sessions by user
  const userSessionMap = new Map<string, typeof activeSessionsForUsers>();
  activeSessionsForUsers.forEach(sess => {
    if (!userSessionMap.has(sess.userId)) {
      userSessionMap.set(sess.userId, []);
    }
    userSessionMap.get(sess.userId)!.push(sess);
  });

  // Transform to user stats
  const usersWithStats = Array.from(userSessionMap.entries())
    .map(([_userId, sessions]) => {
      if (!sessions[0]) return null;
      const user = sessions[0].user;
      const suspiciousSessions = sessions.filter(s => s.isSuspicious).length;
      const riskScore = suspiciousSessions > 0 ? Math.min(suspiciousSessions * 20, 100) : 0;
      const sortedSessions = [...sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const lastLogin = sortedSessions[0]?.createdAt || new Date();
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        activeSessions: sessions.length,
        suspiciousSessions,
        riskScore,
        lastLogin,
      };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .slice(0, 100); // Take top 100 users

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Session Analytics
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              System-wide session monitoring and security analytics
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Interactive Session Management */}
      <AdminSessionsClient
        initialUsers={usersWithStats}
        totalActiveSessions={totalActiveSessions}
        suspiciousSessions={suspiciousSessions}
        recentLogins={recentLogins}
        uniqueActiveUsers={uniqueActiveUsers.length}
      />

      {/* Live Monitoring Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatDetectionPanel />
        <SessionTimeline />
      </div>

      {/* Section Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-600 dark:text-slate-400">
            📊 Detailed Analytics
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card accent="primary" variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <CardTitle className="text-base">Device Types</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceBreakdown.map((device) => {
                const total = deviceBreakdown.reduce((sum, d) => sum + d._count, 0);
                const percentage = ((device._count / total) * 100).toFixed(1);
                
                return (
                  <div key={device.deviceType || 'unknown'} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                        {device.deviceType || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {device._count} ({percentage}%)
                      </div>
                      <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Trust Levels */}
        <Card accent="success" variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <CardTitle className="text-base">Trust Levels</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trustLevels.map((level) => {
                const total = trustLevels.reduce((sum, l) => sum + l._count, 0);
                const percentage = ((level._count / total) * 100).toFixed(1);
                const labels = ['New', 'Recognized', 'Trusted'];
                const colors = ['text-slate-600', 'text-blue-600', 'text-green-600'];
                const bgColors = ['bg-slate-500', 'bg-blue-500', 'bg-green-500'];
                
                return (
                  <div key={level.trustLevel} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${colors[level.trustLevel]}`} />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {labels[level.trustLevel]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {level._count} ({percentage}%)
                      </div>
                      <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${bgColors[level.trustLevel]} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card accent="info" variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <CardTitle className="text-base">Geographic Distribution (Top 10)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {geoDistribution.map((geo) => (
              <div key={geo.country} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {geo.country}
                  </span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {geo._count} sessions
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card accent="purple" variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <CardTitle className="text-base">Activity Breakdown (Last 7 Days)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityBreakdown.map((activity: any) => (
              <div key={activity.action} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize font-mono">
                  {activity.action.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {activity._count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Suspicious Activity */}
      {recentSuspicious.length > 0 && (
        <Card accent="danger" variant="elevated" className="bg-red-50/50 dark:bg-red-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <CardTitle className="text-base text-red-900 dark:text-red-100">
                Suspicious Sessions (Last 7 Days)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSuspicious.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">
                      {session.user.name || session.user.email}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {session.deviceName} • {session.city}, {session.country}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Log */}
      <Card accent="info" variant="elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <CardTitle className="text-base">Recent Activity (Last 24h)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentActivity.slice(0, 50).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white capitalize">
                    {activity.action.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {activity.session.user.name || activity.session.user.email}
                  </div>
                  {activity.endpoint && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {activity.endpoint}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {new Date(activity.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
              Security Monitoring Active
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This page displays real-time system-wide session data. Suspicious activity is automatically flagged based on login patterns, geographic anomalies, and device changes. Regular monitoring helps maintain account security across all users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

