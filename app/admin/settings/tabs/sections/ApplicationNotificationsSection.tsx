import { memo } from "react";
import { Input, Switch } from "@/components/common";
import { Field } from "../../components/SettingsComponents";
import { Info } from "lucide-react";

interface ApplicationNotificationsSectionProps {
  settings: {
    discordApplicationsWebhookUrl: string;
    notifyOnNewApplication: boolean;
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: { notifications: Partial<ApplicationNotificationsSectionProps["settings"]> }) => void;
}

export const ApplicationNotificationsSection = memo(function ApplicationNotificationsSection({ settings, onChange }: ApplicationNotificationsSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
        Discord Notifications
      </h3>
      <Field label="Applications Webhook URL">
        <Input
          value={settings.discordApplicationsWebhookUrl}
          onChange={(e) =>
            onChange({ notifications: { discordApplicationsWebhookUrl: e.target.value } })
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
          checked={settings.notifyOnNewApplication}
          onCheckedChange={(checked) =>
            onChange({ notifications: { notifyOnNewApplication: checked } })
          }
        />
      </div>
    </div>
  );
});

