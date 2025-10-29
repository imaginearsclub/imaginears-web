import { memo } from 'react';
import { Input } from '@/components/common';
import { cn } from '@/lib/utils';

interface AdvancedSettingsSectionProps {
  showAdvanced: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onToggleAdvanced: (show: boolean) => void;
  rateLimit: string;
  /* eslint-disable-next-line no-unused-vars */
  onRateLimitChange: (value: string) => void;
  autoDisableThreshold: string;
  /* eslint-disable-next-line no-unused-vars */
  onAutoDisableThresholdChange: (value: string) => void;
  maxRetries: string;
  /* eslint-disable-next-line no-unused-vars */
  onMaxRetriesChange: (value: string) => void;
  timeout: string;
  /* eslint-disable-next-line no-unused-vars */
  onTimeoutChange: (value: string) => void;
  ipWhitelist: string;
  /* eslint-disable-next-line no-unused-vars */
  onIpWhitelistChange: (value: string) => void;
  customHeaders: string;
  /* eslint-disable-next-line no-unused-vars */
  onCustomHeadersChange: (value: string) => void;
  submitting: boolean;
}

export const AdvancedSettingsSection = memo(function AdvancedSettingsSection({
  showAdvanced,
  onToggleAdvanced,
  rateLimit,
  onRateLimitChange,
  autoDisableThreshold,
  onAutoDisableThresholdChange,
  maxRetries,
  onMaxRetriesChange,
  timeout,
  onTimeoutChange,
  ipWhitelist,
  onIpWhitelistChange,
  customHeaders,
  onCustomHeadersChange,
  submitting,
}: AdvancedSettingsSectionProps) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggleAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-expanded={showAdvanced}
        aria-controls="advanced-settings"
      >
        <span className="text-sm font-medium">Advanced Settings</span>
        <span className={cn("transition-transform", showAdvanced && "rotate-180")}>
          ▼
        </span>
      </button>

      {showAdvanced && (
        <div id="advanced-settings" className="mt-4 space-y-4 p-4 border rounded-lg dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rate Limit (req/min)
              </label>
              <Input
                type="number"
                placeholder="60"
                value={rateLimit}
                onChange={(e) => onRateLimitChange(e.target.value)}
                disabled={submitting}
                aria-label="Rate limit in requests per minute"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave 0 for unlimited
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Auto-Disable Threshold
              </label>
              <Input
                type="number"
                placeholder="10"
                value={autoDisableThreshold}
                onChange={(e) => onAutoDisableThresholdChange(e.target.value)}
                disabled={submitting}
                aria-label="Number of consecutive failures before auto-disabling"
              />
              <p className="text-xs text-slate-500 mt-1">
                Consecutive failures to disable
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Retries
              </label>
              <Input
                type="number"
                placeholder="3"
                value={maxRetries}
                onChange={(e) => onMaxRetriesChange(e.target.value)}
                disabled={submitting}
                aria-label="Maximum number of retry attempts"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                placeholder="30"
                value={timeout}
                onChange={(e) => onTimeoutChange(e.target.value)}
                disabled={submitting}
                aria-label="Request timeout in seconds"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              IP Whitelist
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono text-sm resize-none"
              placeholder="192.168.1.1&#10;10.0.0.0/8"
              rows={3}
              value={ipWhitelist}
              onChange={(e) => onIpWhitelistChange(e.target.value)}
              disabled={submitting}
              aria-label="IP whitelist, one IP or CIDR per line"
            />
            <p className="text-xs text-slate-500 mt-1">
              One IP address or CIDR range per line (optional)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Headers (JSON)
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono text-sm resize-none"
              placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
              rows={4}
              value={customHeaders}
              onChange={(e) => onCustomHeadersChange(e.target.value)}
              disabled={submitting}
              aria-label="Custom HTTP headers in JSON format"
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional custom headers to include in webhook requests
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

