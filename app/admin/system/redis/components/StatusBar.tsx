import { memo } from "react";
import { Badge, Button, Tooltip } from "@/components/common";
import { cn } from "@/lib/utils";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface StatusBarProps {
  status: "healthy" | "warning" | "critical";
  timestamp: string;
  autoRefresh: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onAutoRefreshToggle: (value: boolean) => void;
  testingConnection: boolean;
  onTestConnection: () => void;
  loading: boolean;
  onRefresh: () => void;
  cleaningUp: boolean;
  onCleanup: () => void;
}

export const StatusBar = memo(function StatusBar({
  status,
  timestamp,
  autoRefresh,
  onAutoRefreshToggle,
  testingConnection,
  onTestConnection,
  loading,
  onRefresh,
  cleaningUp,
  onCleanup,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {status === "healthy" && (
          <Badge variant="success" size="lg" className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Healthy
          </Badge>
        )}
        {status === "warning" && (
          <Badge variant="warning" size="lg" className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Warning
          </Badge>
        )}
        {status === "critical" && (
          <Badge variant="error" size="lg" className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            Critical
          </Badge>
        )}
        
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Last updated: {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip content={autoRefresh ? "Disable auto-refresh (updates every 30s)" : "Enable auto-refresh (updates every 30s)"}>
          <Button
            size="sm"
            variant={autoRefresh ? "primary" : "outline"}
            onClick={() => onAutoRefreshToggle(!autoRefresh)}
            aria-label={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
            className={cn("transition-all", autoRefresh && "ring-2 ring-blue-400 dark:ring-blue-600")}
          >
            <Activity className={cn("w-4 h-4", autoRefresh && "animate-pulse")} />
          </Button>
        </Tooltip>

        <Tooltip content={testingConnection ? "Testing connection..." : "Test Redis connection and latency"}>
          <Button
            size="sm"
            variant="outline"
            onClick={onTestConnection}
            disabled={testingConnection}
            aria-label="Test Redis connection"
            aria-busy={testingConnection}
          >
            <Zap className={cn("w-4 h-4", testingConnection && "animate-pulse")} />
          </Button>
        </Tooltip>

        <Tooltip content="Refresh Redis health data">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh Redis health data"
            aria-busy={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </Tooltip>

        <Tooltip content={cleaningUp ? "Cleaning up old jobs..." : "Clean up completed and failed jobs older than 7 days"}>
          <Button
            size="sm"
            variant="outline"
            onClick={onCleanup}
            disabled={cleaningUp}
            aria-label="Clean up old BullMQ jobs"
            aria-busy={cleaningUp}
          >
            <Trash2 className={cn("w-4 h-4", cleaningUp && "animate-pulse text-red-600 dark:text-red-400")} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});

