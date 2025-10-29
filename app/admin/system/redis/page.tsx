"use client";

import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert, Spinner } from "@/components/common";
import { Database } from "lucide-react";
import { useRedisHealth } from "./hooks/useRedisHealth";
import { StatusBar } from "./components/StatusBar";
import { OverviewCards } from "./components/OverviewCards";
import { MemoryDetails } from "./components/MemoryDetails";
import { QueueStatistics } from "./components/QueueStatistics";
import { PerformanceStats } from "./components/PerformanceStats";
import { KeyspaceInfo } from "./components/KeyspaceInfo";

export default function RedisMonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);

  const {
    health,
    loading,
    testingConnection,
    cleaningUp,
    fetchHealth,
    testConnection,
    cleanupOldJobs,
  } = useRedisHealth(autoRefresh);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!health) {
    return (
      <Alert variant="error">
        Failed to load Redis health data. You may not have permission to view this page.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Redis Monitoring"
        description="Monitor Redis instance performance, memory usage, and BullMQ queues"
        icon={<Database className="w-5 h-5" />}
      />

      <StatusBar
        status={health.status}
        timestamp={health.timestamp}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={setAutoRefresh}
        testingConnection={testingConnection}
        onTestConnection={testConnection}
        loading={loading}
        onRefresh={fetchHealth}
        cleaningUp={cleaningUp}
        onCleanup={cleanupOldJobs}
      />

      {health.warnings.length > 0 && (
        <Alert variant="warning">
          <strong>Warnings Detected:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {health.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      <OverviewCards
        uptime={health.uptime}
        memory={health.memory}
        connectedClients={health.connectedClients}
        blockedClients={health.blockedClients}
        opsPerSec={health.stats.instantaneousOpsPerSec}
        totalCommands={health.stats.totalCommandsProcessed}
      />

      <MemoryDetails memory={health.memory} />

      <QueueStatistics queues={health.queues} />

      <PerformanceStats stats={health.stats} />

      <KeyspaceInfo keyspaces={health.keyspaces} />
    </div>
  );
}
