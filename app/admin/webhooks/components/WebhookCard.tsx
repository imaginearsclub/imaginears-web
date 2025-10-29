import { memo, useMemo } from 'react';
import { Card, Badge } from '@/components/common';
import { Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebhookItem } from '../types';
import { WebhookHeader } from './WebhookHeader';
import { WebhookStats } from './WebhookStats';

interface WebhookCardProps {
  webhook: WebhookItem;
  /* eslint-disable-next-line no-unused-vars */
  onEdit: (webhook: WebhookItem) => void;
  /* eslint-disable-next-line no-unused-vars */
  onTest: (webhook: WebhookItem) => void;
  /* eslint-disable-next-line no-unused-vars */
  onViewLogs: (webhook: WebhookItem) => void;
  /* eslint-disable-next-line no-unused-vars */
  onToggleActive: (webhook: WebhookItem) => void;
  /* eslint-disable-next-line no-unused-vars */
  onDelete: (webhook: WebhookItem) => void;
}

export const WebhookCard = memo(function WebhookCard({
  webhook,
  onEdit,
  onTest,
  onViewLogs,
  onToggleActive,
  onDelete,
}: WebhookCardProps) {
  const successRate = useMemo(() => {
    const total = webhook.successCount + webhook.failureCount;
    if (total === 0) return 0;
    return Math.round((webhook.successCount / total) * 100);
  }, [webhook.successCount, webhook.failureCount]);

  return (
    <Card className={cn("p-6 transition-all", !webhook.active && "opacity-60")}>
      <WebhookHeader
        webhook={webhook}
        onEdit={onEdit}
        onTest={onTest}
        onViewLogs={onViewLogs}
        onToggleActive={onToggleActive}
        onDelete={onDelete}
      />

      {/* Description */}
      {webhook.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {webhook.description}
        </p>
      )}

      {/* URL */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs font-mono break-all">
        <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span className="truncate">{webhook.url}</span>
      </div>

      {/* Events */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
          Events ({webhook.events.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {webhook.events.slice(0, 3).map((event) => (
            <Badge key={event} variant="default" size="sm">
              {event}
            </Badge>
          ))}
          {webhook.events.length > 3 && (
            <Badge variant="default" size="sm">
              +{webhook.events.length - 3} more
            </Badge>
          )}
        </div>
      </div>

      <WebhookStats successRate={successRate} deliveryCount={webhook.deliveryCount} />

      {/* Health Metrics */}
      {webhook.active && (webhook.avgResponseTime !== null || webhook.consecutiveFailures > 0) && (
        <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
          {webhook.avgResponseTime !== null && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Avg Response</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                {webhook.avgResponseTime}ms
              </p>
            </div>
          )}
          {webhook.consecutiveFailures > 0 && (
            <div>
              <p className="text-xs text-red-500 dark:text-red-400">Consecutive Failures</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">
                {webhook.consecutiveFailures}/{webhook.autoDisableThreshold}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Last Failure Reason */}
      {webhook.lastFailureReason && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            Last Error:
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 font-mono">
            {webhook.lastFailureReason}
          </p>
        </div>
      )}

      {/* Last Triggered */}
      {webhook.lastTriggeredAt && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            Last triggered {new Date(webhook.lastTriggeredAt).toLocaleString()}
          </div>
        </div>
      )}
    </Card>
  );
});

