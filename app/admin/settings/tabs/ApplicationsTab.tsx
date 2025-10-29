import { memo } from "react";
import { Input, Switch, Separator } from "@/components/common";
import { Card, CardHeader, Field, SaveButton } from "../components/SettingsComponents";
import { Info, UserPlus } from "lucide-react";

interface ApplicationsTabProps {
  settings: {
    applications: {
      turnstileSiteKey: string;
      allowApplications: boolean;
    };
    notifications: {
      discordApplicationsWebhookUrl: string;
      notifyOnNewApplication: boolean;
      discordWebhookUrl: string;
      discordEventsWebhookUrl: string;
      notifyOnNewEvent: boolean;
      emailNotifications: boolean;
      adminEmail: string;
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<ApplicationsTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<ApplicationsTabProps["settings"]>) => void;
  saving: boolean;
}

export const ApplicationsTab = memo(function ApplicationsTab({
  settings,
  onChange,
  onSave,
  saving,
}: ApplicationsTabProps) {
  return (
    <Card>
      <CardHeader title="Applications" description="Configure application settings and spam protection" />
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
            Form Settings
          </h3>
          <div className="space-y-4">
            <Field label="Cloudflare Turnstile Site Key">
              <Input
                value={settings.applications.turnstileSiteKey}
                onChange={(e) =>
                  onChange({
                    applications: { ...settings.applications, turnstileSiteKey: e.target.value },
                  })
                }
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
                checked={settings.applications.allowApplications}
                onCheckedChange={(checked) =>
                  onChange({
                    applications: { ...settings.applications, allowApplications: checked },
                  })
                }
                aria-label="Toggle applications on or off"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
            Discord Notifications
          </h3>
          <Field label="Applications Webhook URL">
            <Input
              value={settings.notifications.discordApplicationsWebhookUrl}
              onChange={(e) =>
                onChange({
                  notifications: {
                    ...settings.notifications,
                    discordApplicationsWebhookUrl: e.target.value,
                  },
                })
              }
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Discord webhook for new application notifications
            </p>
          </Field>
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Notify on New Application
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send Discord notification when someone submits an application
              </p>
            </div>
            <Switch
              checked={settings.notifications.notifyOnNewApplication}
              onCheckedChange={(checked) =>
                onChange({
                  notifications: { ...settings.notifications, notifyOnNewApplication: checked },
                })
              }
            />
          </div>
        </div>

        <SaveButton 
          onClick={() => onSave({ applications: settings.applications, notifications: settings.notifications })} 
          disabled={saving} 
        />
      </div>
    </Card>
  );
});

