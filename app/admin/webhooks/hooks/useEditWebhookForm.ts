import { useState, useCallback, useEffect } from 'react';
import { useWebhookSubmit } from './useWebhookSubmit';
import { useSecretRotation } from './useSecretRotation';

interface WebhookItem {
  id: string;
  name: string;
  description: string | null;
  url: string;
  events: string[];
  active: boolean;
  rateLimit?: number | null;
  autoDisableThreshold?: number;
  ipWhitelist?: string[] | null;
  headers?: Record<string, string> | null;
  maxRetries?: number;
  timeout?: number;
}

export function useEditWebhookForm(
  webhook: WebhookItem, 
  onSuccess: () => void, 
  /* eslint-disable-next-line no-unused-vars */
  onOpenChange: (open: boolean) => void
) {
  const [name, setName] = useState(webhook.name);
  const [description, setDescription] = useState(webhook.description || "");
  const [url, setUrl] = useState(webhook.url);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook.events);
  const [active, setActive] = useState(webhook.active);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rateLimit, setRateLimit] = useState(webhook.rateLimit?.toString() || "60");
  const [autoDisableThreshold, setAutoDisableThreshold] = useState(webhook.autoDisableThreshold?.toString() || "10");
  const [ipWhitelist, setIpWhitelist] = useState(webhook.ipWhitelist?.join("\n") || "");
  const [customHeaders, setCustomHeaders] = useState(webhook.headers ? JSON.stringify(webhook.headers, null, 2) : "");
  const [maxRetries, setMaxRetries] = useState(webhook.maxRetries?.toString() || "3");
  const [timeout, setTimeoutValue] = useState(webhook.timeout?.toString() || "30");

  const { submitting, handleSubmit: submitWebhook } = useWebhookSubmit(webhook.id, onSuccess, onOpenChange);
  const { rotatingSecret, newSecret, handleRotateSecret, resetSecret } = useSecretRotation(webhook.id);

  useEffect(() => {
    setName(webhook.name);
    setDescription(webhook.description || "");
    setUrl(webhook.url);
    setSelectedEvents(webhook.events);
    setActive(webhook.active);
    setRateLimit(webhook.rateLimit?.toString() || "60");
    setAutoDisableThreshold(webhook.autoDisableThreshold?.toString() || "10");
    setIpWhitelist(webhook.ipWhitelist?.join("\n") || "");
    setCustomHeaders(webhook.headers ? JSON.stringify(webhook.headers, null, 2) : "");
    setMaxRetries(webhook.maxRetries?.toString() || "3");
    setTimeoutValue(webhook.timeout?.toString() || "30");
    resetSecret();
  }, [webhook, resetSecret]);

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

  const handleSubmit = useCallback(() => {
    submitWebhook({
      name,
      description,
      url,
      selectedEvents,
      active,
      rateLimit,
      autoDisableThreshold,
      ipWhitelist,
      customHeaders,
      maxRetries,
      timeout,
    });
  }, [submitWebhook, name, description, url, selectedEvents, active, rateLimit,
      autoDisableThreshold, ipWhitelist, customHeaders, maxRetries, timeout]);

  return {
    name, setName,
    description, setDescription,
    url, setUrl,
    selectedEvents,
    active, setActive,
    submitting,
    rotatingSecret,
    newSecret,
    showAdvanced, setShowAdvanced,
    rateLimit, setRateLimit,
    autoDisableThreshold, setAutoDisableThreshold,
    ipWhitelist, setIpWhitelist,
    customHeaders, setCustomHeaders,
    maxRetries, setMaxRetries,
    timeout, setTimeoutValue,
    toggleEvent,
    selectAllInCategory,
    handleRotateSecret,
    handleSubmit,
  };
}

