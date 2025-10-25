'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { Shield, AlertTriangle, TrendingUp, Activity, Info } from 'lucide-react';

interface RiskStatistics {
  totalSessions: number;
  riskLevels: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  avgRiskScore: number;
  topRiskFactors: Array<{
    name: string;
    count: number;
  }>;
  recentHighRisk: any[];
}

export function SessionRiskDashboard() {
  const [stats, setStats] = useState<RiskStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRiskStats() {
      try {
        const response = await fetch('/api/user/sessions/risk?type=statistics');
        if (!response.ok) throw new Error('Failed to fetch risk statistics');
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching risk stats:', err);
        setError('Failed to load risk statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchRiskStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
              Loading risk analysis...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">{error || 'Unknown error'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-slate-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30';
      case 'critical': return 'bg-red-100 dark:bg-red-900/30';
      default: return 'bg-slate-100';
    }
  };

  const avgRiskLevel = 
    stats.avgRiskScore >= 70 ? 'critical' :
    stats.avgRiskScore >= 50 ? 'high' :
    stats.avgRiskScore >= 25 ? 'medium' : 'low';

  const totalRiskCount = 
    stats.riskLevels.low + 
    stats.riskLevels.medium + 
    stats.riskLevels.high + 
    stats.riskLevels.critical;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <CardTitle className="text-base">Session Risk Analysis</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Risk Score */}
        <div className={`p-4 rounded-lg ${getRiskBgColor(avgRiskLevel)}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Average Risk Score
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Based on {stats.totalSessions} sessions
              </div>
            </div>
            <div className={`text-3xl font-bold ${getRiskColor(avgRiskLevel)}`}>
              {stats.avgRiskScore}
            </div>
          </div>
          <div className="w-full h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getRiskColor(avgRiskLevel).replace('text-', 'bg-')}`}
              style={{ width: `${stats.avgRiskScore}%` }}
            />
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-white mb-3">
            Risk Distribution
          </div>
          <div className="space-y-3">
            {totalRiskCount > 0 ? (
              <>
                <RiskLevelBar
                  label="Low"
                  count={stats.riskLevels.low}
                  total={totalRiskCount}
                  color="green"
                />
                <RiskLevelBar
                  label="Medium"
                  count={stats.riskLevels.medium}
                  total={totalRiskCount}
                  color="yellow"
                />
                <RiskLevelBar
                  label="High"
                  count={stats.riskLevels.high}
                  total={totalRiskCount}
                  color="orange"
                />
                <RiskLevelBar
                  label="Critical"
                  count={stats.riskLevels.critical}
                  total={totalRiskCount}
                  color="red"
                />
              </>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No sessions to analyze
              </div>
            )}
          </div>
        </div>

        {/* Top Risk Factors */}
        {stats.topRiskFactors.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-3">
              Top Risk Factors
            </div>
            <div className="space-y-2">
              {stats.topRiskFactors.map((factor, index) => (
                <div
                  key={factor.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {factor.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {factor.count} {factor.count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Message */}
        {stats.riskLevels.critical > 0 || stats.riskLevels.high > 0 ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-300">
              <span className="font-semibold">Action Required:</span> You have {stats.riskLevels.critical + stats.riskLevels.high} high-risk sessions. 
              Review and revoke suspicious sessions immediately.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div className="text-xs text-green-700 dark:text-green-300">
              <span className="font-semibold">All Clear:</span> No high-risk sessions detected. Your account appears secure.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskLevelBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    green: 'bg-green-500 dark:bg-green-400',
    yellow: 'bg-yellow-500 dark:bg-yellow-400',
    orange: 'bg-orange-500 dark:bg-orange-400',
    red: 'bg-red-500 dark:bg-red-400',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </div>
      <div className="flex-1">
        <div className="w-full h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClasses[color]} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="w-16 text-right">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {count}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          ({percentage.toFixed(0)}%)
        </div>
      </div>
    </div>
  );
}

