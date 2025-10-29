import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/components/common';
import { clientLog } from '@/lib/client-logger';
import type { WebhookItem } from '../types';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/webhooks");
      if (!res.ok) throw new Error("Failed to load webhooks");
      
      const data = await res.json();
      if (isMountedRef.current) {
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Webhooks fetch failed', { error: err });
      
      if (isMountedRef.current) {
        toast.error(err.message || "Failed to load webhooks");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  const handleToggleActive = useCallback(async (webhook: WebhookItem) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !webhook.active }),
      });

      if (!res.ok) throw new Error("Failed to update webhook");

      toast.success(`Webhook ${webhook.active ? "disabled" : "enabled"}`);
      loadWebhooks();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Webhook toggle failed', { error: err, webhookId: webhook.id });
      toast.error(err.message || "Failed to update webhook");
    }
  }, [loadWebhooks]);

  const handleTest = useCallback(async (webhook: WebhookItem) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${webhook.id}/test`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Webhook test successful", {
          message: `Responded in ${data.responseTime}ms with status ${data.statusCode}`,
        });
      } else {
        toast.error("Webhook test failed", {
          message: data.error || "Unknown error",
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Webhook test failed', { error: err, webhookId: webhook.id });
      toast.error(err.message || "Failed to test webhook");
    }
  }, []);

  const handleDelete = useCallback(async (webhook: WebhookItem) => {
    if (!confirm(`Are you sure you want to delete "${webhook.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/webhooks/${webhook.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete webhook");

      toast.success("Webhook deleted successfully");
      loadWebhooks();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Webhook deletion failed', { error: err, webhookId: webhook.id });
      toast.error(err.message || "Failed to delete webhook");
    }
  }, [loadWebhooks]);

  return {
    webhooks,
    loading,
    loadWebhooks,
    handleToggleActive,
    handleTest,
    handleDelete,
  };
}

