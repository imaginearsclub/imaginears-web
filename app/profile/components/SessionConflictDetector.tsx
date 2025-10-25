'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common';

interface Conflict {
  session1: string;
  session2: string;
  similarity: number;
  conflictType: 'duplicate' | 'takeover' | 'shared_account' | 'location_mismatch';
  recommendation: string;
  differences: Array<{
    field: string;
    value1: any;
    value2: any;
    significance: 'low' | 'medium' | 'high';
  }>;
}

interface TakeoverAttempt {
  suspectedSession: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export function SessionConflictDetector() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [takeovers, setTakeovers] = useState<TakeoverAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const fetchData = async () => {
    try {
      const [conflictsRes, takeoverRes] = await Promise.all([
        fetch('/api/user/sessions/comparison?type=conflicts'),
        fetch('/api/user/sessions/comparison?type=takeover'),
      ]);

      if (conflictsRes.ok) {
        const data = await conflictsRes.json();
        setConflicts(data.comparisons || []);
      }

      if (takeoverRes.ok) {
        const data = await takeoverRes.json();
        setTakeovers(data.takeovers || []);
      }
    } catch (err) {
      console.error('Error fetching conflict data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveConflicts = async (strategy: 'keep_newest' | 'keep_trusted' | 'require_manual') => {
    setResolving(true);
    try {
      const response = await fetch('/api/user/sessions/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_conflicts',
          strategy,
        }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error resolving conflicts:', err);
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
              Analyzing sessions...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasIssues = conflicts.length > 0 || takeovers.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <CardTitle className="text-base">Conflict Detection</CardTitle>
          </div>
          {hasIssues && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30">
                {conflicts.length + takeovers.length} {conflicts.length + takeovers.length === 1 ? 'Issue' : 'Issues'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Takeover Attempts */}
        {takeovers.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Potential Account Takeover ({takeovers.length})
            </div>
            <div className="space-y-3">
              {takeovers.map((takeover, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    takeover.severity === 'critical' || takeover.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                      takeover.severity === 'critical' || takeover.severity === 'high'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          Suspicious Session Detected
                        </span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          takeover.severity === 'critical'
                            ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : takeover.severity === 'high'
                            ? 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                            : 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {takeover.severity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Session ID: <code className="font-mono">{takeover.suspectedSession}</code>
                      </div>
                      <ul className="space-y-1 mb-3">
                        {takeover.indicators.map((indicator, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-xs font-medium text-slate-900 dark:text-white p-2 rounded bg-white/50 dark:bg-slate-800/50">
                        💡 {takeover.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Conflicts */}
        {conflicts.length > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Session Conflicts ({conflicts.length})
            </div>
            <div className="space-y-3">
              {conflicts.map((conflict, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        {conflict.conflictType.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Similarity: {conflict.similarity}%
                      </div>
                      <div className="space-y-1 mb-2">
                        {conflict.differences
                          .filter(d => d.significance === 'high')
                          .map((diff, i) => (
                            <div key={i} className="text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-medium">{diff.field}:</span> {String(diff.value1)} → {String(diff.value2)}
                            </div>
                          ))}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300 p-2 rounded bg-white/50 dark:bg-slate-800/50">
                        💡 {conflict.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-Resolve Options */}
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Quick Actions
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveConflicts('keep_newest')}
                  disabled={resolving}
                >
                  Keep Newest
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveConflicts('keep_trusted')}
                  disabled={resolving}
                >
                  Keep Most Trusted
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchData()}
                  disabled={resolving}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* No Issues */}
        {!hasIssues && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm font-medium text-green-900 dark:text-green-100">
                No Conflicts Detected
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                All sessions appear normal. No suspicious activity or conflicts found.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

