import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/common';
import { clientLog } from '@/lib/client-logger';

export function useWebhookForm(onSuccess: () => void, onOpenChange: (open: boolean) => void) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState("");
  const [generatedSecret, setGeneratedSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rateLimit, setRateLimit] = useState("60");
  const [autoDisableThreshold, setAutoDisableThreshold] = useState("10");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [customHeaders, setCustomHeaders] = useState("");
  const [maxRetries, setMaxRetries] = useState("3");
  const [timeout, setTimeoutValue] = useState("30");

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleGenerateSecret = useCallback(() => {
    const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSecret(randomSecret);
    setGeneratedSecret(true);
  }, []);

  const handleCopySecret = useCallback(() => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedSecret(false), 2000);
    toast.success("Secret copied to clipboard");
  }, [secret]);

  const toggleEvent = useCallback((eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(e => e !== eventId)
        : [...prev, eventId]
    );
  }, []);

  const selectAllInCategory = useCallback((categoryEventIds: string[]) => {
    const allSelected = categoryEventIds.every(e => selectedEvents.includes(e));
    
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(e => !categoryEventIds.includes(e)));
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...categoryEventIds])]);
    }
  }, [selectedEvents]);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setUrl("");
    setSelectedEvents([]);
    setSecret("");
    setGeneratedSecret(false);
    setShowAdvanced(false);
    setRateLimit("60");
    setAutoDisableThreshold("10");
    setIpWhitelist("");
    setCustomHeaders("");
    setMaxRetries("3");
    setTimeoutValue("30");
  }, []);

  const handleSubmit = useCallback(async () => {
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
        } catch (e) {
          toast.error("Invalid custom headers JSON");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          url,
          events: selectedEvents,
          secret: secret || undefined,
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
        throw new Error(error.error || "Failed to create webhook");
      }

      toast.success("Webhook created successfully");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      clientLog.error('Webhook creation failed', { error: err });
      toast.error(err.message || "Failed to create webhook");
    } finally {
      setSubmitting(false);
    }
  }, [name, description, url, selectedEvents, secret, rateLimit, autoDisableThreshold, 
      ipWhitelist, customHeaders, maxRetries, timeout, onSuccess, onOpenChange, resetForm]);

  return {
    name, setName,
    description, setDescription,
    url, setUrl,
    selectedEvents,
    secret, setSecret,
    generatedSecret,
    copiedSecret,
    submitting,
    showAdvanced, setShowAdvanced,
    rateLimit, setRateLimit,
    autoDisableThreshold, setAutoDisableThreshold,
    ipWhitelist, setIpWhitelist,
    customHeaders, setCustomHeaders,
    maxRetries, setMaxRetries,
    timeout, setTimeoutValue,
    handleGenerateSecret,
    handleCopySecret,
    toggleEvent,
    selectAllInCategory,
    handleSubmit,
  };
}

