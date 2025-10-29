"use client";

import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from "@/components/common";
import { Webhook } from "lucide-react";
import { useWebhookForm } from "../hooks/useWebhookForm";
import { BasicInfoSection } from "./BasicInfoSection";
import { EventsSection } from "./EventsSection";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";

interface CreateWebhookDrawerProps {
  open: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateWebhookDrawer = memo(function CreateWebhookDrawer({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateWebhookDrawerProps) {
  const {
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
  } = useWebhookForm(onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Webhook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle>Create Webhook</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <BasicInfoSection
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            url={url}
            onUrlChange={setUrl}
            secret={secret}
            onSecretChange={setSecret}
            generatedSecret={generatedSecret}
            copiedSecret={copiedSecret}
            onGenerateSecret={handleGenerateSecret}
            onCopySecret={handleCopySecret}
            submitting={submitting}
          />

          <EventsSection
            selectedEvents={selectedEvents}
            onToggleEvent={toggleEvent}
            onSelectAllInCategory={selectAllInCategory}
          />

          <AdvancedSettingsSection
            showAdvanced={showAdvanced}
            onToggleAdvanced={setShowAdvanced}
            rateLimit={rateLimit}
            onRateLimitChange={setRateLimit}
            autoDisableThreshold={autoDisableThreshold}
            onAutoDisableThresholdChange={setAutoDisableThreshold}
            maxRetries={maxRetries}
            onMaxRetriesChange={setMaxRetries}
            timeout={timeout}
            onTimeoutChange={setTimeoutValue}
            ipWhitelist={ipWhitelist}
            onIpWhitelistChange={setIpWhitelist}
            customHeaders={customHeaders}
            onCustomHeadersChange={setCustomHeaders}
            submitting={submitting}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Webhook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

