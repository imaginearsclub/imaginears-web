import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { clientLog } from "@/lib/client-logger";

type RedisHealth = {
  status: "healthy" | "warning" | "critical";
  uptime: number;
  connectedClients: number;
  blockedClients: number;
  memory: {
    usedMemory: number;
    usedMemoryHuman: string;
    usedMemoryPeak: number;
    usedMemoryPeakHuman: string;
    totalSystemMemory: number;
    totalSystemMemoryHuman: string;
    maxMemory: number;
    maxMemoryHuman: string;
    maxMemoryPolicy: string;
    memoryFragmentationRatio: number;
    usedPercentage: number;
  };
  stats: {
    totalConnectionsReceived: number;
    totalCommandsProcessed: number;
    instantaneousOpsPerSec: number;
    totalNetInputBytes: number;
    totalNetOutputBytes: number;
    rejectedConnections: number;
    expiredKeys: number;
    evictedKeys: number;
    keyspaceHits: number;
    keyspaceMisses: number;
  };
  keyspaces: Array<{
    db: number;
    keys: number;
    expires: number;
    avgTtl: number;
  }>;
  queues: Array<{
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
  }>;
  warnings: string[];
  timestamp: string;
};

export function useRedisHealth(autoRefresh: boolean) {
  const [health, setHealth] = useState<RedisHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/redis/health");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You don't have permission to view Redis monitoring");
        }
        throw new Error("Failed to fetch Redis health");
      }
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      clientLog.error("Redis health fetch failed", { error });
      toast.error(error instanceof Error ? error.message : "Failed to fetch Redis health");
    } finally {
      setLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/admin/redis/test");
      if (!res.ok) throw new Error("Test failed");
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Redis connection successful! Latency: ${data.latency}ms`);
      } else {
        toast.error(`Redis connection failed: ${data.error}`);
      }
    } catch (error) {
      clientLog.error("Redis connection test failed", { error });
      toast.error("Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  }, []);

  const cleanupOldJobs = useCallback(async () => {
    setCleaningUp(true);
    try {
      const res = await fetch("/api/admin/redis/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Cleanup failed");
      const data = await res.json();
      
      toast.success(`Cleaned up ${data.cleaned} old jobs`);
      await fetchHealth();
    } catch (error) {
      clientLog.error("Redis cleanup failed", { error });
      toast.error("Failed to cleanup jobs");
    } finally {
      setCleaningUp(false);
    }
  }, [fetchHealth]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHealth, 30000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchHealth]);

  return {
    health,
    loading,
    testingConnection,
    cleaningUp,
    fetchHealth,
    testConnection,
    cleanupOldJobs,
  };
}

