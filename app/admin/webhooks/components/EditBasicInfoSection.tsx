import { memo } from 'react';
import { Input, Switch, Alert } from '@/components/common';

interface EditBasicInfoSectionProps {
  name: string;
  /* eslint-disable-next-line no-unused-vars */
  onNameChange: (value: string) => void;
  description: string;
  /* eslint-disable-next-line no-unused-vars */
  onDescriptionChange: (value: string) => void;
  url: string;
  /* eslint-disable-next-line no-unused-vars */
  onUrlChange: (value: string) => void;
  active: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onActiveChange: (value: boolean) => void;
  newSecret: string | null;
  submitting: boolean;
}

export const EditBasicInfoSection = memo(function EditBasicInfoSection({
  name, onNameChange,
  description, onDescriptionChange,
  url, onUrlChange,
  active, onActiveChange,
  newSecret,
  submitting,
}: EditBasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Active Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div>
          <p className="font-medium">Webhook Status</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {active ? "Webhook is active and receiving events" : "Webhook is disabled"}
          </p>
        </div>
        <Switch
          checked={active}
          onCheckedChange={onActiveChange}
          disabled={submitting}
        />
      </div>

      {/* New Secret Alert */}
      {newSecret && (
        <Alert variant="success">
          <p className="font-semibold mb-2">New Secret Generated</p>
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded font-mono text-sm break-all">
            {newSecret}
          </div>
          <p className="text-xs mt-2">
            Make sure to copy this secret! You won't be able to see it again.
          </p>
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="My Webhook"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <Input
          placeholder="What this webhook is used for"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          URL <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={submitting}
        />
      </div>
    </div>
  );
});

