import { memo } from 'react';
import { Input, Button, Alert } from '@/components/common';
import { Copy, Check } from 'lucide-react';

interface BasicInfoSectionProps {
  name: string;
  /* eslint-disable-next-line no-unused-vars */
  onNameChange: (value: string) => void;
  description: string;
  /* eslint-disable-next-line no-unused-vars */
  onDescriptionChange: (value: string) => void;
  url: string;
  /* eslint-disable-next-line no-unused-vars */
  onUrlChange: (value: string) => void;
  secret: string;
  /* eslint-disable-next-line no-unused-vars */
  onSecretChange: (value: string) => void;
  generatedSecret: boolean;
  copiedSecret: boolean;
  onGenerateSecret: () => void;
  onCopySecret: () => void;
  submitting: boolean;
}

export const BasicInfoSection = memo(function BasicInfoSection({
  name, onNameChange,
  description, onDescriptionChange,
  url, onUrlChange,
  secret, onSecretChange,
  generatedSecret,
  copiedSecret,
  onGenerateSecret,
  onCopySecret,
  submitting,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
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
        <p className="text-xs text-slate-500 mt-1">
          The endpoint that will receive webhook POST requests
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Webhook Secret
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="Auto-generated if not provided"
            value={secret}
            onChange={(e) => onSecretChange(e.target.value)}
            disabled={submitting}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            onClick={onGenerateSecret}
            disabled={submitting}
          >
            Generate
          </Button>
          {secret && (
            <Button
              variant="outline"
              onClick={onCopySecret}
              disabled={submitting}
              aria-label={copiedSecret ? "Secret copied" : "Copy secret"}
            >
              {copiedSecret ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>
        {generatedSecret && (
          <Alert variant="warning" className="mt-2">
            <p className="text-xs">
              Make sure to copy this secret! You won't be able to see it again after creating the webhook.
            </p>
          </Alert>
        )}
        <p className="text-xs text-slate-500 mt-1">
          Used to verify webhook signatures (HMAC SHA-256)
        </p>
      </div>
    </div>
  );
});

