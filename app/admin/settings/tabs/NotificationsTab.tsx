import { memo } from "react";
import { Input, Switch, Separator } from "@/components/common";
import { Card, CardHeader, Field, SaveButton } from "../components/SettingsComponents";
import { Info } from "lucide-react";

interface NotificationsTabProps {
  settings: {
    notifications: {
      discordWebhookUrl: string;
      discordApplicationsWebhookUrl: string;
      discordEventsWebhookUrl: string;
      notifyOnNewApplication: boolean;
      notifyOnNewEvent: boolean;
      emailNotifications: boolean;
      adminEmail: string;
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<NotificationsTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<NotificationsTabProps["settings"]>) => void;
  saving: boolean;
}

export const NotificationsTab = memo(function NotificationsTab({
  settings,
  onChange,
  onSave,
  saving,
}: NotificationsTabProps) {
  return (
    <Card>
      <CardHeader title="Notifications" description="Configure event notifications and email settings" />
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
            Event Notifications
          </h3>
          <Field label="Events Discord Webhook URL">
            <Input
              value={settings.notifications.discordEventsWebhookUrl}
              onChange={(e) =>
                onChange({
                  notifications: { ...settings.notifications, discordEventsWebhookUrl: e.target.value },
                })
              }
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Discord webhook for new event notifications
            </p>
          </Field>

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">Notify on New Event</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send Discord notification when a new event is created
              </p>
            </div>
            <Switch
              checked={settings.notifications.notifyOnNewEvent}
              onCheckedChange={(checked) =>
                onChange({
                  notifications: { ...settings.notifications, notifyOnNewEvent: checked },
                })
              }
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
            Email Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white">
                  Enable Email Notifications
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Send email alerts for important events
                </p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  onChange({
                    notifications: { ...settings.notifications, emailNotifications: checked },
                  })
                }
              />
            </div>
            <Field label="Admin Email">
              <Input
                type="email"
                value={settings.notifications.adminEmail}
                onChange={(e) =>
                  onChange({
                    notifications: { ...settings.notifications, adminEmail: e.target.value },
                  })
                }
                placeholder="admin@example.com"
              />
            </Field>
          </div>
        </div>

        <SaveButton onClick={() => onSave({ notifications: settings.notifications })} disabled={saving} />
      </div>
    </Card>
  );
});

