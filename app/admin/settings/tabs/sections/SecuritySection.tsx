import { memo } from "react";
import { Input, Switch } from "@/components/common";
import { Field } from "../../components/SettingsComponents";

interface SecuritySectionProps {
  settings: {
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
    requireEmailVerification: boolean;
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: { security: SecuritySectionProps["settings"] }) => void;
}

export const SecuritySection = memo(function SecuritySection({ settings, onChange }: SecuritySectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
        Security Settings
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white">Rate Limiting</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Limit API requests to prevent abuse
            </p>
          </div>
          <Switch
            checked={settings.rateLimitEnabled}
            onCheckedChange={(checked) => onChange({ security: { ...settings, rateLimitEnabled: checked } })}
          />
        </div>
        <Field label="Max Requests Per Minute">
          <Input
            type="number"
            min={10}
            max={1000}
            value={settings.maxRequestsPerMinute}
            onChange={(e) =>
              onChange({ security: { ...settings, maxRequestsPerMinute: parseInt(e.target.value) || 60 } })
            }
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recommended: 60-120 requests per minute
          </p>
        </Field>
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Require Email Verification
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Users must verify their email before accessing features
            </p>
          </div>
          <Switch
            checked={settings.requireEmailVerification}
            onCheckedChange={(checked) =>
              onChange({ security: { ...settings, requireEmailVerification: checked } })
            }
          />
        </div>
      </div>
    </div>
  );
});

