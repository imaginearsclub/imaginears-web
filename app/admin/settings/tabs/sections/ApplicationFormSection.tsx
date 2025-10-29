import { memo } from "react";
import { Input, Switch, Separator } from "@/components/common";
import { Field } from "../../components/SettingsComponents";
import { Info, UserPlus } from "lucide-react";

interface ApplicationFormSectionProps {
  settings: {
    turnstileSiteKey: string;
    allowApplications: boolean;
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: { applications: ApplicationFormSectionProps["settings"] }) => void;
}

export const ApplicationFormSection = memo(function ApplicationFormSection({ settings, onChange }: ApplicationFormSectionProps) {
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
          Form Settings
        </h3>
        <div className="space-y-4">
          <Field label="Cloudflare Turnstile Site Key">
            <Input
              value={settings.turnstileSiteKey}
              onChange={(e) => onChange({ applications: { ...settings, turnstileSiteKey: e.target.value } })}
              placeholder="0x4AAAAAAA..."
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Public key for Cloudflare Turnstile CAPTCHA
            </p>
          </Field>
          <div className="flex items-center justify-between p-5 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
            <div>
              <label className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                Allow Applications
              </label>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                When disabled, the public application page will show an &quot;Applications Closed&quot; message
              </p>
            </div>
            <Switch
              checked={settings.allowApplications}
              onCheckedChange={(checked) => onChange({ applications: { ...settings, allowApplications: checked } })}
              aria-label="Toggle applications on or off"
            />
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
});

