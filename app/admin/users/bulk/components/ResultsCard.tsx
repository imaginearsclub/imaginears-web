import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { CheckCircle } from 'lucide-react';

interface ResultsCardProps {
  results: {
    success: number;
    failed: number;
    total: number;
  };
}

export const ResultsCard = memo(function ResultsCard({ results }: ResultsCardProps) {
  return (
    <Card className="border-2 border-green-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <CardTitle className="text-base text-green-900 dark:text-green-100">
            Operation Completed
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {results.success}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Successful
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {results.total}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Total
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">
              {results.failed}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              Failed
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

