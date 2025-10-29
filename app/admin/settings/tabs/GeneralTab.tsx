import { memo } from "react";
import { Input, Switch, Separator } from "@/components/common";
import { Card, CardHeader, Field, SaveButton } from "../components/SettingsComponents";

interface GeneralTabProps {
  settings: {
    siteName: string;
    timezone: string;
    features: {
      showEventsOnHome: boolean;
      showApplicationsOnHome: boolean;
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<GeneralTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<GeneralTabProps["settings"]>) => void;
  saving: boolean;
}

const inputClass = "w-full rounded-xl border-2 px-4 py-3 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";

export const GeneralTab = memo(function GeneralTab({ settings, onChange, onSave, saving }: GeneralTabProps) {
  return (
    <Card>
      <CardHeader title="General Settings" description="Basic configuration for your site" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Site Name">
            <Input
              value={settings.siteName}
              onChange={(e) => onChange({ siteName: e.target.value })}
              placeholder="Enter site name"
            />
          </Field>
          <Field label="Timezone">
                <select
                  className={inputClass}
                  value={settings.timezone}
                  onChange={(e) => onChange({ timezone: e.target.value })}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(Intl as any).supportedValuesOf?.("timeZone")?.map((tz: string) => (
                    <option key={tz} value={tz}>{tz}</option>
                  )) || <option>America/New_York</option>}
                </select>
          </Field>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Show Events on Homepage
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Display events section on the homepage
              </p>
            </div>
            <Switch
              checked={settings.features.showEventsOnHome}
              onCheckedChange={(checked) =>
                onChange({ features: { ...settings.features, showEventsOnHome: checked } })
              }
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Show Applications on Homepage
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Display application form section on the homepage
              </p>
            </div>
            <Switch
              checked={settings.features.showApplicationsOnHome}
              onCheckedChange={(checked) =>
                onChange({ features: { ...settings.features, showApplicationsOnHome: checked } })
              }
            />
          </div>
        </div>

        <SaveButton 
          onClick={() => onSave({ siteName: settings.siteName, timezone: settings.timezone, features: settings.features })} 
          disabled={saving} 
        />
      </div>
    </Card>
  );
});

