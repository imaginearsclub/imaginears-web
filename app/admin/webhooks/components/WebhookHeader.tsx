import { memo, useCallback } from 'react';
import { Button, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/common';
import { Webhook, MoreVertical, Trash2, Edit, TestTube, Activity, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WebhookItem } from '../types';

interface WebhookHeaderProps {
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

const getHealthBadge = (status: string) => {
  switch (status) {
    case "healthy":
      return <Badge variant="success" size="sm">Healthy</Badge>;
    case "degraded":
      return <Badge variant="warning" size="sm">Degraded</Badge>;
    case "unhealthy":
      return <Badge variant="danger" size="sm">Unhealthy</Badge>;
    case "disabled":
      return <Badge variant="default" size="sm">Disabled</Badge>;
    default:
      return <Badge variant="default" size="sm">{status}</Badge>;
  }
};

export const WebhookHeader = memo(function WebhookHeader({
  webhook,
  onEdit,
  onTest,
  onViewLogs,
  onToggleActive,
  onDelete,
}: WebhookHeaderProps) {
  const handleEdit = useCallback(() => onEdit(webhook), [onEdit, webhook]);
  const handleTest = useCallback(() => onTest(webhook), [onTest, webhook]);
  const handleViewLogs = useCallback(() => onViewLogs(webhook), [onViewLogs, webhook]);
  const handleToggleActive = useCallback(() => onToggleActive(webhook), [onToggleActive, webhook]);
  const handleDelete = useCallback(() => onDelete(webhook), [onDelete, webhook]);

  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-2 rounded-lg",
          webhook.active
            ? webhook.healthStatus === "healthy"
              ? "bg-green-100 dark:bg-green-900/30"
              : webhook.healthStatus === "degraded"
              ? "bg-yellow-100 dark:bg-yellow-900/30"
              : webhook.healthStatus === "unhealthy"
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-slate-100 dark:bg-slate-800"
            : "bg-slate-100 dark:bg-slate-800"
        )}>
          <Webhook className={cn(
            "w-4 h-4",
            webhook.active
              ? webhook.healthStatus === "healthy"
                ? "text-green-600 dark:text-green-400"
                : webhook.healthStatus === "degraded"
                ? "text-yellow-600 dark:text-yellow-400"
                : webhook.healthStatus === "unhealthy"
                ? "text-red-600 dark:text-red-400"
                : "text-slate-500"
              : "text-slate-500"
          )} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {webhook.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            {webhook.integrationType && (
              <Badge variant="info" size="sm">
                {webhook.integrationType}
              </Badge>
            )}
            {webhook.active && getHealthBadge(webhook.healthStatus)}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Webhook options">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTest}>
            <TestTube className="w-4 h-4 mr-2" />
            Test
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewLogs}>
            <Activity className="w-4 h-4 mr-2" />
            View Logs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {webhook.active ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Disable
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Enable
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

