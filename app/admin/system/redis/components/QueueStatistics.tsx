import { memo } from "react";
import { Card, Badge } from "@/components/common";
import { BarChart3 } from "lucide-react";

interface Queue {
  name: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  isPaused: boolean;
}

interface QueueStatisticsProps {
  queues: Queue[];
}

export const QueueStatistics = memo(function QueueStatistics({ queues }: QueueStatisticsProps) {
  if (queues.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        BullMQ Queue Statistics
      </h2>
      <div className="space-y-4">
        {queues.map((queue) => (
          <div key={queue.name} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                {queue.name} Queue
              </h3>
              {queue.isPaused && <Badge variant="warning">Paused</Badge>}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Waiting</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {queue.counts.waiting}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {queue.counts.active}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {queue.counts.completed.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Failed</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {queue.counts.failed.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Delayed</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                  {queue.counts.delayed}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Success Rate</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {queue.counts.completed + queue.counts.failed > 0
                    ? ((queue.counts.completed / (queue.counts.completed + queue.counts.failed)) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

