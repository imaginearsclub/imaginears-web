"use client";

import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from "@/components/common";
import { Edit } from "lucide-react";
import { useEditWebhookForm } from "../hooks/useEditWebhookForm";
import { EditBasicInfoSection } from "./EditBasicInfoSection";
import { SecretRotationSection } from "./SecretRotationSection";
import { EventsSection } from "./EventsSection";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";

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

interface EditWebhookDrawerProps {
  webhook: WebhookItem;
  open: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditWebhookDrawer = memo(function EditWebhookDrawer({ 
  webhook, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditWebhookDrawerProps) {
  const {
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
  } = useEditWebhookForm(webhook, onSuccess, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle>Edit Webhook</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <EditBasicInfoSection
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            url={url}
            onUrlChange={setUrl}
            active={active}
            onActiveChange={setActive}
            newSecret={newSecret}
            submitting={submitting}
          />

          <SecretRotationSection
            onRotateSecret={handleRotateSecret}
            submitting={submitting}
            rotatingSecret={rotatingSecret}
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
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

