import { memo } from "react";
import { Input, Switch, Separator } from "@/components/common";
import { Card, CardHeader, Field, SaveButton } from "../components/SettingsComponents";
import { Info, AlertCircle } from "lucide-react";

interface SecurityTabProps {
  settings: {
    maintenance: {
      enabled: boolean;
      message: string;
      allowedIPs: string[];
    };
    security: {
      rateLimitEnabled: boolean;
      maxRequestsPerMinute: number;
      requireEmailVerification: boolean;
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<SecurityTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<SecurityTabProps["settings"]>) => void;
  saving: boolean;
}

export const SecurityTab = memo(function SecurityTab({ settings, onChange, onSave, saving }: SecurityTabProps) {
  return (
    <Card>
      <CardHeader title="Security & Maintenance" description="Configure security settings and maintenance mode" />
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-600 dark:bg-amber-500 rounded-full" />
            Maintenance Mode
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
              <div>
                <label className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Maintenance Mode
                </label>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Show maintenance page to non-admin users
                </p>
              </div>
              <Switch
                checked={settings.maintenance.enabled}
                onCheckedChange={(checked) =>
                  onChange({ maintenance: { ...settings.maintenance, enabled: checked } })
                }
              />
            </div>
            <Field label="Maintenance Message">
              <Input
                value={settings.maintenance.message}
                onChange={(e) =>
                  onChange({ maintenance: { ...settings.maintenance, message: e.target.value } })
                }
                placeholder="We'll be back soon!"
              />
            </Field>
            <Field label="Allowed IPs (Bypass Maintenance)">
              <Input
                value={settings.maintenance.allowedIPs.join(", ")}
                onChange={(e) => {
                  const ips = e.target.value
                    .split(",")
                    .map((ip) => ip.trim())
                    .filter(Boolean);
                  onChange({ maintenance: { ...settings.maintenance, allowedIPs: ips } });
                }}
                placeholder="192.168.1.1, 10.0.0.1"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Comma-separated list of IP addresses that can bypass maintenance mode
              </p>
            </Field>
          </div>
        </div>

        <Separator />

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
                checked={settings.security.rateLimitEnabled}
                onCheckedChange={(checked) =>
                  onChange({ security: { ...settings.security, rateLimitEnabled: checked } })
                }
              />
            </div>
            <Field label="Max Requests Per Minute">
              <Input
                type="number"
                min={10}
                max={1000}
                value={settings.security.maxRequestsPerMinute}
                onChange={(e) =>
                  onChange({
                    security: { ...settings.security, maxRequestsPerMinute: parseInt(e.target.value) || 60 },
                  })
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
                checked={settings.security.requireEmailVerification}
                onCheckedChange={(checked) =>
                  onChange({ security: { ...settings.security, requireEmailVerification: checked } })
                }
              />
            </div>
          </div>
        </div>

        <SaveButton 
          onClick={() => onSave({ maintenance: settings.maintenance, security: settings.security })} 
          disabled={saving} 
        />
      </div>
    </Card>
  );
});

