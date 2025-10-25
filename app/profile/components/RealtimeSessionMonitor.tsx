'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { Activity, AlertTriangle, MapPin, Monitor, RefreshCw } from 'lucide-react';

interface RealtimeStats {
  activeSessions: number;
  recentActivity: number;
  suspiciousSessions: number;
  timestamp: string;
}

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  sessions: string[];
}

interface ConcurrentSession {
  id: string;
  device: string | null;
  location: string;
  lastSeen: string;
  isActive: boolean;
}

export function RealtimeSessionMonitor() {
  const [stats, setStats] = useState<RealtimeStats | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [concurrent, setConcurrent] = useState<ConcurrentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const [statsRes, anomaliesRes, concurrentRes] = await Promise.all([
        fetch('/api/user/sessions/monitoring?type=stats'),
        fetch('/api/user/sessions/monitoring?type=anomalies'),
        fetch('/api/user/sessions/monitoring?type=concurrent'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalies(data.anomalies || []);
      }

      if (concurrentRes.ok) {
        const data = await concurrentRes.json();
        setConcurrent(data.sessions || []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(), 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
              Loading live monitoring...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 dark:text-yellow-400';
      case 'medium': return 'text-orange-600 dark:text-orange-400';
      case 'high': return 'text-red-600 dark:text-red-400';
      default: return 'text-slate-600';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'medium': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'high': return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-slate-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <CardTitle className="text-base">Live Session Monitor</CardTitle>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Real-time Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Active"
            value={stats?.activeSessions || 0}
            icon={Monitor}
            color="blue"
          />
          <StatCard
            label="Activity/Hr"
            value={stats?.recentActivity || 0}
            icon={Activity}
            color="green"
          />
          <StatCard
            label="Suspicious"
            value={stats?.suspiciousSessions || 0}
            icon={AlertTriangle}
            color={stats?.suspiciousSessions && stats.suspiciousSessions > 0 ? 'red' : 'slate'}
          />
        </div>

        {/* Concurrent Sessions */}
        {concurrent.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              Active Right Now ({concurrent.length})
            </div>
            <div className="space-y-2">
              {concurrent.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {session.device || 'Unknown Device'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {session.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-3">
                    {session.isActive ? 'Active' : formatLastSeen(session.lastSeen)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              Threats Detected ({anomalies.length})
            </div>
            <div className="space-y-2">
              {anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityBg(anomaly.severity)} border-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'orange' : 'yellow'}-200 dark:border-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'orange' : 'yellow'}-800`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${getSeverityColor(anomaly.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {anomaly.type}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {anomaly.description}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {anomaly.sessions.length} {anomaly.sessions.length === 1 ? 'session' : 'sessions'} affected
                      </div>
                    </div>
                    <div className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getSeverityBg(anomaly.severity)} ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Anomalies Message */}
        {anomalies.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              No suspicious activity detected
            </span>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: 'blue' | 'green' | 'red' | 'slate';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  };

  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

function formatLastSeen(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

