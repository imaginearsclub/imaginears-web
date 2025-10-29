import { memo } from "react";
import { Card, CardHeader, SaveButton } from "../components/SettingsComponents";
import { MaintenanceSection } from "./sections/MaintenanceSection";
import { SecuritySection } from "./sections/SecuritySection";

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
        <MaintenanceSection settings={settings.maintenance} onChange={onChange} />
        <SecuritySection settings={settings.security} onChange={onChange} />
        <SaveButton 
          onClick={() => onSave({ maintenance: settings.maintenance, security: settings.security })} 
          disabled={saving} 
        />
      </div>
    </Card>
  );
});

