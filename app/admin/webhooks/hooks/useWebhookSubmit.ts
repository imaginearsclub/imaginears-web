import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/common';
import { clientLog } from '@/lib/client-logger';

interface SubmitData {
  name: string;
  description: string;
  url: string;
  selectedEvents: string[];
  active: boolean;
  rateLimit: string;
  autoDisableThreshold: string;
  ipWhitelist: string;
  customHeaders: string;
  maxRetries: string;
  timeout: string;
}

export function useWebhookSubmit(
  webhookId: string,
  onSuccess: () => void,
  /* eslint-disable-next-line no-unused-vars */
  onOpenChange: (open: boolean) => void
) {
  const [submitting, setSubmitting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = useCallback(async (data: SubmitData) => {
    const { name, description, url, selectedEvents, active, rateLimit, 
            autoDisableThreshold, ipWhitelist, customHeaders, maxRetries, timeout } = data;

    if (!name || !url || selectedEvents.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const ipWhitelistArray = ipWhitelist
        .split("\n")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);

      let headersObj: Record<string, string> | undefined = undefined;
      if (customHeaders) {
        try {
          headersObj = JSON.parse(customHeaders);
        } catch {
          toast.error("Invalid custom headers JSON");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch(`/api/admin/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          url,
          events: selectedEvents,
          active,
          rateLimit: rateLimit ? parseInt(rateLimit, 10) : null,
          autoDisableThreshold: parseInt(autoDisableThreshold, 10),
          ipWhitelist: ipWhitelistArray.length > 0 ? ipWhitelistArray : null,
          headers: headersObj,
          maxRetries: parseInt(maxRetries, 10),
          timeout: parseInt(timeout, 10),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update webhook");
      }

      toast.success("Webhook updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Webhook update failed', { error: err, webhookId });
      toast.error(err.message || "Failed to update webhook");
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [webhookId, onSuccess, onOpenChange]);

  return { submitting, handleSubmit };
}