import { memo } from 'react';
import { cn } from '@/lib/utils';

interface WebhookStatsProps {
  successRate: number;
  deliveryCount: number;
}

export const WebhookStats = memo(function WebhookStats({ successRate, deliveryCount }: WebhookStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Success Rate</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-lg font-bold",
            successRate >= 95 ? "text-green-600 dark:text-green-400" :
            successRate >= 80 ? "text-yellow-600 dark:text-yellow-400" :
            "text-red-600 dark:text-red-400"
          )}>
            {successRate}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Deliveries</p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {deliveryCount}
        </p>
      </div>
    </div>
  );
});

