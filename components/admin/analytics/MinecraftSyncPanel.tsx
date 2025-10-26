"use client";

import { useState } from "react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Alert } from "@/components/common/Alert";
import { Gamepad2, RefreshCw, CheckCircle2, AlertCircle, Wifi } from "lucide-react";

export function MinecraftSyncPanel() {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
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
        setLastSyncTime(new Date());
        // Refresh the page data after successful sync
        window.location.reload();
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
          <Badge variant="success" className="text-xs">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {/* Test Connection */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleTest}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            <Wifi className="w-4 h-4 mr-2" />
            {testing ? "Testing..." : "Test Connection"}
          </Button>

          <Button
            onClick={handleSync}
            disabled={syncing}
            variant="default"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
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

        {/* Setup Instructions */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <span>Plan Player Analytics Setup</span>
            <Badge variant="info" className="text-xs">Cookie Auth</Badge>
          </h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Create a web user in Plan:
              <code className="block ml-5 mt-1 text-xs bg-muted px-2 py-1 rounded">
                /plan register username password
              </code>
            </li>
            <li>Add to your <code className="text-xs bg-muted px-1 py-0.5 rounded">.env</code>:</li>
          </ol>
          <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs overflow-x-auto">
{`# Plan Player Analytics (Cookie-based Auth)
PLAN_API_URL=https://your-server.com:8804
PLAN_USERNAME=your-plan-username
PLAN_PASSWORD=your-plan-password
PLAN_SERVER_IDENTIFIER=Server 1  # Optional`}
          </pre>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-medium">Common URLs:</span>
            </p>
            <ul className="text-xs text-muted-foreground ml-4 space-y-0.5">
              <li>• Direct: <code className="bg-muted px-1 py-0.5 rounded">https://server.com:8804</code></li>
              <li>• Proxied: <code className="bg-muted px-1 py-0.5 rounded">https://domain.com/plan</code></li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Uses cookie-based authentication (Set-Cookie) - Plan will auto-renew sessions
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

