import { memo } from 'react';
import { Card, CardContent } from '@/components/common';

interface ProgressCardProps {
  progress: number;
}

export const ProgressCard = memo(function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <Card className="border-2 border-blue-500">
      <CardContent className="py-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Processing...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

