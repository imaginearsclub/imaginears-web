'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { Activity, TrendingUp, TrendingDown, Clock, Database, Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface HealthMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  recentActivity: number;
  activityLast24h: number;
  avgSessionDuration: number;
  avgActiveSessions: number;
  peakConcurrentSessions: number;
  sessionCreationRate: number;
  sessionTerminationRate: number;
  avgDatabaseQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
}

interface Props {
  initialMetrics: HealthMetrics;
}

export function SessionHealthClient({ initialMetrics }: Props) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      setRefreshing(true);
      try {
        // In production, fetch from API
        // const response = await fetch('/api/admin/sessions/health');
        // const data = await response.json();
        // setMetrics(data);
        
        // Simulate minor fluctuations
        setMetrics(prev => ({
          ...prev,
          recentActivity: prev.recentActivity + Math.floor(Math.random() * 10) - 5,
          activeSessions: prev.activeSessions + Math.floor(Math.random() * 6) - 3,
        }));
      } catch (error) {
        console.error('Failed to refresh metrics:', error);
      } finally {
        setRefreshing(false);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getHealthStatus = () => {
    if (metrics.errorRate > 5) return { status: 'critical', color: 'red', label: 'Critical' };
    if (metrics.errorRate > 1) return { status: 'warning', color: 'orange', label: 'Warning' };
    if (metrics.cacheHitRate < 80) return { status: 'degraded', color: 'yellow', label: 'Degraded' };
    return { status: 'healthy', color: 'green', label: 'Healthy' };
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card className={`border-2 border-${health.color}-500`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {health.status === 'healthy' ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <AlertCircle className="w-12 h-12 text-orange-500" />
              )}
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  System {health.label}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  All session services operating normally
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-${health.color}-500 ${refreshing ? '' : 'animate-pulse'}`} />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Live
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Activity}
          label="Active Sessions"
          value={metrics.activeSessions}
          subtitle={`${metrics.totalSessions} total`}
          trend={12}
          color="blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Recent Activity"
          value={metrics.recentActivity}
          subtitle="Last hour"
          color="purple"
        />
        <MetricCard
          icon={Clock}
          label="Avg Duration"
          value={`${metrics.avgSessionDuration}m`}
          subtitle="Per session"
          color="green"
        />
        <MetricCard
          icon={Zap}
          label="Cache Hit Rate"
          value={`${metrics.cacheHitRate}%`}
          subtitle={metrics.cacheHitRate >= 90 ? 'Excellent' : 'Good'}
          color="cyan"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatRow
                label="Total Sessions (All-time)"
                value={metrics.totalSessions.toLocaleString()}
              />
              <StatRow
                label="Active Sessions"
                value={metrics.activeSessions.toLocaleString()}
                percentage={(metrics.activeSessions / metrics.totalSessions) * 100}
              />
              <StatRow
                label="Expired Sessions"
                value={metrics.expiredSessions.toLocaleString()}
                percentage={(metrics.expiredSessions / metrics.totalSessions) * 100}
              />
              <StatRow
                label="Average Active Sessions"
                value={metrics.avgActiveSessions.toLocaleString()}
              />
              <StatRow
                label="Peak Concurrent Sessions"
                value={metrics.peakConcurrentSessions.toLocaleString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatRow
                label="Activity (Last Hour)"
                value={metrics.recentActivity.toLocaleString()}
              />
              <StatRow
                label="Activity (Last 24h)"
                value={metrics.activityLast24h.toLocaleString()}
              />
              <StatRow
                label="Session Creation Rate"
                value={`${metrics.sessionCreationRate}/min`}
              />
              <StatRow
                label="Session Termination Rate"
                value={`${metrics.sessionTerminationRate}/min`}
              />
              <StatRow
                label="Net Growth Rate"
                value={`${(metrics.sessionCreationRate - metrics.sessionTerminationRate).toFixed(1)}/min`}
                trend={metrics.sessionCreationRate > metrics.sessionTerminationRate ? 'up' : 'down'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PerformanceGauge
              label="Database Query Time"
              value={metrics.avgDatabaseQueryTime}
              max={100}
              unit="ms"
              thresholds={{ good: 30, warning: 60 }}
            />
            <PerformanceGauge
              label="Cache Hit Rate"
              value={metrics.cacheHitRate}
              max={100}
              unit="%"
              thresholds={{ good: 90, warning: 80 }}
              inverted
            />
            <PerformanceGauge
              label="Error Rate"
              value={metrics.errorRate}
              max={10}
              unit="%"
              thresholds={{ good: 0.5, warning: 2 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Lifecycle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Lifecycle Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="text-center flex-1">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {metrics.sessionCreationRate}/min
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Created
              </div>
              <TrendingUp className="w-6 h-6 mx-auto mt-2 text-green-600 dark:text-green-400" />
            </div>

            <div className="text-slate-400 text-4xl">→</div>

            <div className="text-center flex-1">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.activeSessions}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Active Pool
              </div>
              <Activity className="w-6 h-6 mx-auto mt-2 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="text-slate-400 text-4xl">→</div>

            <div className="text-center flex-1">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {metrics.sessionTerminationRate}/min
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Terminated
              </div>
              <TrendingDown className="w-6 h-6 mx-auto mt-2 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.cacheHitRate < 90 && (
              <Recommendation
                type="warning"
                message="Cache hit rate is below optimal. Consider increasing cache size or TTL."
              />
            )}
            {metrics.avgDatabaseQueryTime > 50 && (
              <Recommendation
                type="warning"
                message="Database query time is high. Consider adding indexes or optimizing queries."
              />
            )}
            {metrics.errorRate > 1 && (
              <Recommendation
                type="error"
                message="Error rate is elevated. Check logs for recurring issues."
              />
            )}
            {metrics.peakConcurrentSessions > metrics.avgActiveSessions * 1.5 && (
              <Recommendation
                type="info"
                message="Peak sessions significantly exceed average. Consider horizontal scaling during peak hours."
              />
            )}
            {metrics.cacheHitRate >= 90 && metrics.avgDatabaseQueryTime <= 30 && metrics.errorRate <= 0.5 && (
              <Recommendation
                type="success"
                message="All systems performing optimally. No action required."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, subtitle, trend, color }: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {value}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {label}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </div>
            )}
            {trend !== undefined && (
              <div className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                +{trend}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, percentage, trend }: {
  label: string;
  value: string;
  percentage?: number;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
        {percentage !== undefined && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ({percentage.toFixed(1)}%)
          </span>
        )}
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
      </div>
    </div>
  );
}

function PerformanceGauge({ label, value, max, unit, thresholds, inverted }: {
  label: string;
  value: number;
  max: number;
  unit: string;
  thresholds: { good: number; warning: number };
  inverted?: boolean;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (inverted) {
      if (value >= thresholds.good) return 'green';
      if (value >= thresholds.warning) return 'yellow';
      return 'red';
    } else {
      if (value <= thresholds.good) return 'green';
      if (value <= thresholds.warning) return 'yellow';
      return 'red';
    }
  };

  const color = getColor();
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          {value}{unit}
        </span>
      </div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
        Target: {inverted ? '≥' : '≤'} {thresholds.good}{unit}
      </div>
    </div>
  );
}

function Recommendation({ type, message }: {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}) {
  const config = {
    success: { icon: CheckCircle, color: 'green', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    info: { icon: AlertCircle, color: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    warning: { icon: AlertCircle, color: 'orange', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
    error: { icon: AlertCircle, color: 'red', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  };

  const { icon: Icon, color, bg, border } = config[type];

  return (
    <div className={`p-3 rounded-lg border ${bg} ${border}`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400 mt-0.5`} />
        <p className={`text-sm text-${color}-700 dark:text-${color}-300`}>
          {message}
        </p>
      </div>
    </div>
  );
}

