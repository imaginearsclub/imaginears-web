import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/common';
import { AlertTriangle, X } from 'lucide-react';

interface PreviewUser {
  email: string;
  action: string;
  icon: string;
  [key: string]: unknown;
}

interface PreviewCardProps {
  data: PreviewUser[];
  onClose: () => void;
}

export const PreviewCard = memo(function PreviewCard({ data, onClose }: PreviewCardProps) {
  return (
    <Card className="border-2 border-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-base">
              Preview - {data.length} users will be affected
            </CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {data.slice(0, 50).map((user) => (
            <div
              key={`preview-${user.email}-${user.action}`}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{user.icon}</span>
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.email}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {user.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {data.length > 50 && (
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-2">
              ... and {data.length - 50} more
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

