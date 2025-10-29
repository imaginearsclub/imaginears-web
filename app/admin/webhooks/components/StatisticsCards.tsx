import { memo, useMemo } from 'react';

interface StatisticsCardsProps {
  statistics: {
    total: number;
    success: number;
    failed: number;
    retrying: number;
  };
}

export const StatisticsCards = memo(function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const successRate = useMemo(
    () => statistics.total > 0 ? Math.round((statistics.success / statistics.total) * 100) : 0,
    [statistics.total, statistics.success]
  );

  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        <p className="text-2xl font-bold mt-1">{statistics.total}</p>
      </div>
      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-xs text-green-600 dark:text-green-400">Success</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
          {statistics.success}
        </p>
      </div>
      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
          {statistics.failed}
        </p>
      </div>
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-xs text-yellow-600 dark:text-yellow-400">Retrying</p>
        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
          {statistics.retrying}
        </p>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-600 dark:text-blue-400">Success Rate</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
          {successRate}%
        </p>
      </div>
    </div>
  );
});

