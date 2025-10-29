import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/common';
import { clientLog } from '@/lib/client-logger';

export function useSecretRotation(webhookId: string) {
  const [rotatingSecret, setRotatingSecret] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRotateSecret = useCallback(async () => {
    if (!confirm("Are you sure you want to rotate the webhook secret? This will invalidate the old secret.")) {
      return;
    }

    try {
      setRotatingSecret(true);
      const res = await fetch(`/api/admin/webhooks/${webhookId}/rotate-secret`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to rotate secret");

      const data = await res.json();
      
      if (isMountedRef.current) {
        setNewSecret(data.secret);
        toast.success("Secret rotated successfully");
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Secret rotation failed', { error: err, webhookId });
      
      if (isMountedRef.current) {
        toast.error(err.message || "Failed to rotate secret");
      }
    } finally {
      if (isMountedRef.current) {
        setRotatingSecret(false);
      }
    }
  }, [webhookId]);

  const resetSecret = useCallback(() => {
    setNewSecret(null);
  }, []);

  return { rotatingSecret, newSecret, handleRotateSecret, resetSecret };
}

