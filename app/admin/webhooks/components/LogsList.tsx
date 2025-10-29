import { memo } from 'react';
import { Skeleton, EmptyState } from '@/components/common';
import { Activity } from 'lucide-react';
import { LogItem } from './LogItem';

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

interface LogsListProps {
  logs: DeliveryLog[];
  loading: boolean;
}

const SKELETON_ITEMS = ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5'] as const;

export const LogsList = memo(function LogsList({ logs, loading }: LogsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {SKELETON_ITEMS.map((id) => (
          <div key={id} className="p-4 border rounded-lg dark:border-slate-700">
            <Skeleton className="h-5 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="w-12 h-12" />}
        title="No deliveries yet"
        description="This webhook hasn't received any events yet"
      />
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <LogItem key={log.id} log={log} />
      ))}
    </div>
  );
});

