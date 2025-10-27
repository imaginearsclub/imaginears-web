"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Alert } from "@/components/common/Alert";
import { Tooltip } from "@/components/common/Tooltip";
import { Gamepad2, RefreshCw, CheckCircle2, AlertCircle, Wifi } from "lucide-react";

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function MinecraftSyncPanel() {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Load last sync time from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lastMinecraftSync');
    if (stored) {
      setLastSyncTime(new Date(stored));
    }
  }, []);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    playerCount?: number;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    synced: number;
    errors: number;
    linked: number;
    message: string;
  } | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/minecraft/sync/test");
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to connect to API",
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/minecraft/sync", {
        method: "POST",
      });
      const data = await response.json();
      setSyncResult(data);
      
      if (data.success) {
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem('lastMinecraftSync', now.toISOString());
        // Refresh the page data after successful sync
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setSyncResult({
        success: false,
        synced: 0,
        errors: 1,
        linked: 0,
        message: "Failed to sync players",
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Gamepad2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Minecraft Player Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Sync player data from your Player Analytics Plugin
            </p>
          </div>
        </div>
        {lastSyncTime && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <div className="text-right">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                Last synced
              </p>
              <p className="text-xs text-muted-foreground">
                {getRelativeTime(lastSyncTime)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Test Connection */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Tooltip content={testing ? "Testing..." : "Test Connection"} side="top">
            <Button
              onClick={handleTest}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              <Wifi className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content={syncing ? "Syncing..." : "Sync Players Now"} side="top">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="default"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            </Button>
          </Tooltip>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert
            variant={testResult.success ? "success" : "error"}
            title={testResult.success ? "Connection Successful" : "Connection Failed"}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{testResult.message}</span>
              {testResult.playerCount !== undefined && (
                <Badge variant="success" className="ml-2">
                  {testResult.playerCount} players found
                </Badge>
              )}
            </div>
          </Alert>
        )}

        {/* Sync Result */}
        {syncResult && (
          <Alert
            variant={syncResult.success ? "success" : "error"}
            title={syncResult.success ? "Sync Completed" : "Sync Failed"}
          >
            <div className="space-y-2">
              <p>{syncResult.message}</p>
              {syncResult.success && (
                <div className="flex gap-3 text-sm">
                  <Badge variant="success">{syncResult.synced} synced</Badge>
                  <Badge variant="info">{syncResult.linked} linked</Badge>
                  {syncResult.errors > 0 && (
                    <Badge variant="warning">{syncResult.errors} errors</Badge>
                  )}
                </div>
              )}
            </div>
          </Alert>
        )}
      </div>
    </Card>
  );
}

