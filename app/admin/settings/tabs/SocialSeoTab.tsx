import { memo } from "react";
import { Input, Separator } from "@/components/common";
import { Card, CardHeader, Field, SaveButton, inputClass } from "../components/SettingsComponents";

interface SocialSeoTabProps {
  settings: {
    social: {
      twitter?: string;
      instagram?: string;
      discord?: string;
      youtube?: string;
      facebook?: string;
      tiktok?: string;
    };
    seo: {
      title?: string;
      description?: string;
      image?: string;
      twitterCard?: string;
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<SocialSeoTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<SocialSeoTabProps["settings"]>) => void;
  saving: boolean;
}

export const SocialSeoTab = memo(function SocialSeoTab({ settings, onChange, onSave, saving }: SocialSeoTabProps) {
  return (
    <Card>
      <CardHeader title="Social & SEO" description="Social media links and SEO metadata" />
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
            Social Media Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["twitter", "instagram", "discord", "youtube", "facebook", "tiktok"] as const).map((platform) => {
              const value = platform === "twitter" ? settings.social.twitter
                : platform === "instagram" ? settings.social.instagram
                : platform === "discord" ? settings.social.discord
                : platform === "youtube" ? settings.social.youtube
                : platform === "facebook" ? settings.social.facebook
                : settings.social.tiktok;

              return (
                <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                  <Input
                    value={value || ""}
                    onChange={(e) =>
                      onChange({ social: { ...settings.social, [platform]: e.target.value } })
                    }
                    placeholder={`https://${platform}.com/...`}
                  />
                </Field>
              );
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
            SEO Metadata
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="SEO Title">
              <Input
                value={settings.seo.title || ""}
                onChange={(e) => onChange({ seo: { ...settings.seo, title: e.target.value } })}
                placeholder="Default page title"
              />
            </Field>
            <Field label="SEO Description">
              <Input
                value={settings.seo.description || ""}
                onChange={(e) => onChange({ seo: { ...settings.seo, description: e.target.value } })}
                placeholder="Default meta description"
              />
            </Field>
            <Field label="SEO Image URL">
              <Input
                value={settings.seo.image || ""}
                onChange={(e) => onChange({ seo: { ...settings.seo, image: e.target.value } })}
                placeholder="https://example.com/og-image.png"
              />
            </Field>
            <Field label="Twitter Card Type">
              <select
                className={inputClass}
                value={settings.seo.twitterCard || "summary_large_image"}
                onChange={(e) => onChange({ seo: { ...settings.seo, twitterCard: e.target.value } })}
              >
                <option value="summary_large_image">Large Image</option>
                <option value="summary">Summary</option>
              </select>
            </Field>
          </div>
        </div>

        <SaveButton onClick={() => onSave({ social: settings.social, seo: settings.seo })} disabled={saving} />
      </div>
    </Card>
  );
});

