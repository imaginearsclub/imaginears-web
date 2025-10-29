import { memo, useCallback } from "react";
import { Card, CardHeader, SaveButton } from "../components/SettingsComponents";
import { ApplicationFormSection } from "./sections/ApplicationFormSection";
import { ApplicationNotificationsSection } from "./sections/ApplicationNotificationsSection";

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
  const handleNotificationsChange = useCallback((partial: { notifications: Partial<typeof settings.notifications> }) => {
    onChange({ notifications: { ...settings.notifications, ...partial.notifications } });
  }, [settings.notifications, onChange]);

  return (
    <Card>
      <CardHeader title="Applications" description="Configure application settings and spam protection" />
      <div className="space-y-6">
        <ApplicationFormSection settings={settings.applications} onChange={onChange} />
        <ApplicationNotificationsSection 
          settings={{
            discordApplicationsWebhookUrl: settings.notifications.discordApplicationsWebhookUrl,
            notifyOnNewApplication: settings.notifications.notifyOnNewApplication,
          }}
          onChange={handleNotificationsChange}
        />
        <SaveButton 
          onClick={() => onSave({ applications: settings.applications, notifications: settings.notifications })} 
          disabled={saving} 
        />
      </div>
    </Card>
  );
});

