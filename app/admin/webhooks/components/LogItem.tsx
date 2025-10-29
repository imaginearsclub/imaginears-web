import { memo, useCallback } from 'react';
import { Badge } from '@/components/common';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryLog {
  id: string;
  eventType: string;
  status: string;
  statusCode: number | null;
  responseTime: number | null;
  attemptNumber: number;
  error: string | null;
  createdAt: string;
}

interface LogItemProps {
  log: DeliveryLog;
}

export const LogItem = memo(function LogItem({ log }: LogItemProps) {
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "retrying":
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="success">Success</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      case "retrying":
        return <Badge variant="warning">Retrying</Badge>;
      case "pending":
        return <Badge variant="info">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  }, []);

  return (
    <div className="p-4 border rounded-lg dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          {getStatusIcon(log.status)}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {log.eventType}
              </span>
              {getStatusBadge(log.status)}
              {log.attemptNumber > 1 && (
                <Badge variant="default" size="sm">
                  Attempt {log.attemptNumber}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="text-right">
          {log.statusCode !== null && (
            <div className={cn(
              "text-sm font-mono font-semibold",
              log.statusCode >= 200 && log.statusCode < 300
                ? "text-green-600 dark:text-green-400"
                : log.statusCode >= 400 && log.statusCode < 500
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-red-600 dark:text-red-400"
            )}>
              {log.statusCode}
            </div>
          )}
          {log.responseTime !== null && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {log.responseTime}ms
            </p>
          )}
        </div>
      </div>

      {log.error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono">
            {log.error}
          </p>
        </div>
      )}
    </div>
  );
});

