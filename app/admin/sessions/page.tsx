import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { 
  Activity, 
  AlertTriangle, 
  Shield
} from "lucide-react";
import { AdminSessionsClient } from "./components/AdminSessionsClient";
import { SessionTimeline } from "./components/SessionTimeline";
import { ThreatDetectionPanel } from "./components/ThreatDetectionPanel";
import { ImpossibleTravelAlerts } from "./components/ImpossibleTravelAlerts";

export const dynamic = "force-dynamic";

// Optimized data fetching with proper indexing hints and reduced memory overhead
async function fetchSessionData() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Parallel queries for maximum performance
  const [totalActiveSessions, suspiciousSessions, uniqueActiveUsers, recentSuspicious, activeSessionsForUsers] = 
    await Promise.all([
      prisma.session.count({ where: { expiresAt: { gt: now } } }),
      prisma.session.count({ where: { isSuspicious: true, expiresAt: { gt: now } } }),
      prisma.session.groupBy({ by: ['userId'], where: { expiresAt: { gt: now } } }),
      prisma.session.findMany({
        where: { isSuspicious: true, createdAt: { gte: oneWeekAgo } },
        select: {
          id: true,
          createdAt: true,
          deviceName: true,
          city: true,
          country: true,
          user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.session.findMany({
        where: { expiresAt: { gt: now } },
        select: {
          id: true,
          userId: true,
          isSuspicious: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' }, // Pre-sorted for efficiency
        take: 500,
      }),
    ]);

  // Optimized: Build user stats map with single pass
  const userSessionMap = new Map<string, typeof activeSessionsForUsers>();
  for (const sess of activeSessionsForUsers) {
    const existing = userSessionMap.get(sess.userId);
    if (existing) {
      existing.push(sess);
    } else {
      userSessionMap.set(sess.userId, [sess]);
    }
  }

  // Optimized: Build stats without unnecessary array copies or sorts
  const usersWithStats = Array.from(userSessionMap.entries())
    .map(([, sessions]) => {
      const firstSession = sessions[0];
      if (!firstSession) return null;
      
      const user = firstSession.user;
      let suspCount = 0;
      let lastLoginTime = firstSession.createdAt.getTime();
      
      // Single pass through sessions
      for (const s of sessions) {
        if (s.isSuspicious) suspCount++;
        if (s.createdAt.getTime() > lastLoginTime) {
          lastLoginTime = s.createdAt.getTime();
        }
      }
      
      const riskScore = suspCount > 0 ? Math.min(suspCount * 20, 100) : 0;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        activeSessions: sessions.length,
        suspiciousSessions: suspCount,
        riskScore,
        lastLogin: new Date(lastLoginTime),
      };
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .slice(0, 100);

  return { totalActiveSessions, suspiciousSessions, uniqueActiveUsers, recentSuspicious, usersWithStats };
}

export default async function AdminSessionsPage() {
  const session = await requirePermission("sessions:view_all");
  if (!session) redirect("/login");

  const { totalActiveSessions, suspiciousSessions, uniqueActiveUsers, recentSuspicious, usersWithStats } = 
    await fetchSessionData();

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
        uniqueActiveUsers={uniqueActiveUsers.length}
      />

      {/* Impossible Travel Alerts - Full Width */}
      <ImpossibleTravelAlerts />

      {/* Live Monitoring Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatDetectionPanel />
        <SessionTimeline />
      </div>

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

