import { memo, useMemo } from "react";
import { Card } from "@/components/common";
import { Activity } from "lucide-react";

interface PerformanceStatsProps {
  stats: {
    keyspaceHits: number;
    keyspaceMisses: number;
    evictedKeys: number;
    expiredKeys: number;
    rejectedConnections: number;
  };
}

export const PerformanceStats = memo(function PerformanceStats({ stats }: PerformanceStatsProps) {
  const hitRate = useMemo(() => {
    return stats.keyspaceHits + stats.keyspaceMisses > 0
      ? (stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)) * 100
      : 0;
  }, [stats.keyspaceHits, stats.keyspaceMisses]);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Performance Statistics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Cache Hit Rate</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {hitRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.keyspaceHits.toLocaleString()} hits / {stats.keyspaceMisses.toLocaleString()} misses
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Evicted Keys</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {stats.evictedKeys.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Expired Keys</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {stats.expiredKeys.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Rejected Connections</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {stats.rejectedConnections.toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
});

