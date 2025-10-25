"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from "@/components/common";
import { 
  Activity, 
  MapPin, 
  Monitor, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  suspiciousSessions: number;
  uniqueLocations: number;
  uniqueDevices: number;
  activityByAction: Record<string, number>;
  recentSessions: Array<{
    id: string;
    deviceName: string | null;
    country: string | null;
    city: string | null;
    createdAt: Date;
    lastActivityAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    endpoint: string | null;
    createdAt: Date;
  }>;
}

export function SessionAnalytics() {
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch("/api/user/sessions/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics");
        
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch session analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Session Analytics
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Overview of your account activity and sessions
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.activeSessions}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Active Sessions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.uniqueDevices}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Unique Devices
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.uniqueLocations}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Locations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${analytics.suspiciousSessions > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <AlertTriangle className={`w-5 h-5 ${analytics.suspiciousSessions > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.suspiciousSessions}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Suspicious
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Breakdown */}
      {Object.keys(analytics.activityByAction).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <CardTitle className="text-base">Activity Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.activityByAction)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                      {action.replace(/_/g, " ")}
                    </span>
                    <Badge variant="default" size="sm">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white capitalize">
                    {activity.action.replace(/_/g, " ")}
                  </div>
                  {activity.endpoint && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {activity.endpoint}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Tip */}
      <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
              Security Recommendation
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Regularly review your session activity. If you notice any suspicious patterns or unfamiliar locations, revoke those sessions immediately and change your password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

