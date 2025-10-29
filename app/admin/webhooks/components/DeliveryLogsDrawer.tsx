"use client";

import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from "@/components/common";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeliveryLogs } from "../hooks/useDeliveryLogs";
import { StatisticsCards } from "./StatisticsCards";
import { LogsList } from "./LogsList";

interface WebhookItem {
  id: string;
  name: string;
}

interface DeliveryLogsDrawerProps {
  webhook: WebhookItem;
  open: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onOpenChange: (open: boolean) => void;
}

export const DeliveryLogsDrawer = memo(function DeliveryLogsDrawer({ 
  webhook, 
  open, 
  onOpenChange 
}: DeliveryLogsDrawerProps) {
  const { logs, loading, statistics, loadLogs } = useDeliveryLogs(webhook.id, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle>Delivery Logs</DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                {webhook.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <StatisticsCards statistics={statistics} />
          <LogsList logs={logs} loading={loading} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});