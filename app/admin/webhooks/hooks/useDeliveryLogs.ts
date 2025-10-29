import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/common';
import { clientLog } from '@/lib/client-logger';

interface DeliveryLog {
  id: string;
  eventType: string;
  status: string;
  statusCode: number | null;
  responseTime: number | null;
  attemptNumber: number;
  error: string | null;
  createdAt: string;
}

interface Statistics {
  total: number;
  success: number;
  failed: number;
  pending: number;
  retrying: number;
}

export function useDeliveryLogs(webhookId: string, open: boolean) {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    success: 0,
    failed: 0,
    pending: 0,
    retrying: 0,
  });

  const isMountedRef = useRef(true);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/webhooks/${webhookId}/deliveries`);
      
      if (!res.ok) throw new Error("Failed to load delivery logs");

      const data = await res.json();
      
      if (isMountedRef.current) {
        setLogs(data.deliveries);
        setStatistics(data.statistics);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Delivery logs fetch failed', { error: err, webhookId });
      
      if (isMountedRef.current) {
        toast.error(err.message || "Failed to load delivery logs");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [webhookId]);

  useEffect(() => {
    if (open) {
      loadLogs();
    }
  }, [open, loadLogs]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { logs, loading, statistics, loadLogs };
}

