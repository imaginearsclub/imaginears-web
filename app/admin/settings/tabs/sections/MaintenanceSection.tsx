import { memo, useCallback } from "react";
import { Input, Switch, Separator } from "@/components/common";
import { Field } from "../../components/SettingsComponents";
import { Info, AlertCircle } from "lucide-react";
import { SmartIPInput } from "../../components/SmartIPInput";

interface MaintenanceSectionProps {
  settings: {
    enabled: boolean;
    message: string;
    allowedIPs: string[];
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: { maintenance: MaintenanceSectionProps["settings"] }) => void;
}

export const MaintenanceSection = memo(function MaintenanceSection({ settings, onChange }: MaintenanceSectionProps) {
  const handleToggle = useCallback((checked: boolean) => {
    onChange({ maintenance: { ...settings, enabled: checked } });
  }, [settings, onChange]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ maintenance: { ...settings, message: e.target.value } });
  }, [settings, onChange]);

  const handleIPsChange = useCallback((ips: string[]) => {
    onChange({ maintenance: { ...settings, allowedIPs: ips } });
  }, [settings, onChange]);

  return (
    <>
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
              checked={settings.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
          <Field label="Maintenance Message">
            <Input
              value={settings.message}
              onChange={handleMessageChange}
              placeholder="We'll be back soon!"
            />
          </Field>
          <Field label="Allowed IPs (Bypass Maintenance)">
            <SmartIPInput
              value={settings.allowedIPs}
              onChange={handleIPsChange}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              IP addresses that can access the site during maintenance mode
            </p>
          </Field>
        </div>
      </div>
      <Separator />
    </>
  );
});

