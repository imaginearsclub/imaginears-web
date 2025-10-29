import { memo } from "react";
import { Input } from "@/components/common";
import { Card, CardHeader, Field, SaveButton } from "../components/SettingsComponents";

interface BrandingTabProps {
  settings: {
    branding: {
      logoUrl: string;
      bannerUrl: string;
      accentHex: string;
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<BrandingTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<BrandingTabProps["settings"]>) => void;
  saving: boolean;
}

export const BrandingTab = memo(function BrandingTab({ settings, onChange, onSave, saving }: BrandingTabProps) {
  return (
    <Card>
      <CardHeader title="Branding" description="Customize your site's appearance" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Logo URL">
            <Input
              value={settings.branding.logoUrl}
              onChange={(e) =>
                onChange({ branding: { ...settings.branding, logoUrl: e.target.value } })
              }
              placeholder="https://example.com/logo.png"
            />
          </Field>
          <Field label="Banner URL">
            <Input
              value={settings.branding.bannerUrl}
              onChange={(e) =>
                onChange({ branding: { ...settings.branding, bannerUrl: e.target.value } })
              }
              placeholder="https://example.com/banner.png"
            />
          </Field>
        </div>
        <Field label="Accent Color (Hex)">
          <div className="flex gap-2 items-center">
            <Input
              value={settings.branding.accentHex}
              onChange={(e) =>
                onChange({ branding: { ...settings.branding, accentHex: e.target.value } })
              }
              placeholder="#3b82f6"
              className="flex-1"
            />
            <div
              className="w-16 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-700"
              style={{ backgroundColor: settings.branding.accentHex }}
            />
          </div>
        </Field>

        <SaveButton onClick={() => onSave({ branding: settings.branding })} disabled={saving} />
      </div>
    </Card>
  );
});

