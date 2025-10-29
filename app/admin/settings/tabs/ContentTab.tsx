import { memo } from "react";
import { MarkdownEditor } from "@/components/common";
import { Card, CardHeader, SaveButton } from "../components/SettingsComponents";

interface ContentTabProps {
  settings: {
    homepageIntro: string;
    footerMarkdown: string;
    aboutMarkdown: string;
    applicationsIntroMarkdown: string;
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<ContentTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<ContentTabProps["settings"]>) => void;
  saving: boolean;
}

export const ContentTab = memo(function ContentTab({ settings, onChange, onSave, saving }: ContentTabProps) {
  return (
    <Card>
      <CardHeader title="Content" description="Manage markdown content for various pages" />
      <div className="space-y-4">
        <MarkdownEditor
          label="Homepage Intro"
          value={settings.homepageIntro}
          onChange={(v) => onChange({ homepageIntro: v })}
          rows={10}
        />
        <MarkdownEditor
          label="Footer Content"
          value={settings.footerMarkdown}
          onChange={(v) => onChange({ footerMarkdown: v })}
          rows={8}
        />
        <MarkdownEditor
          label="About Page"
          value={settings.aboutMarkdown}
          onChange={(v) => onChange({ aboutMarkdown: v })}
          rows={12}
        />
        <MarkdownEditor
          label="Applications Intro"
          value={settings.applicationsIntroMarkdown}
          onChange={(v) => onChange({ applicationsIntroMarkdown: v })}
          rows={8}
        />

        <SaveButton 
          onClick={() => onSave({
            homepageIntro: settings.homepageIntro,
            footerMarkdown: settings.footerMarkdown,
            aboutMarkdown: settings.aboutMarkdown,
            applicationsIntroMarkdown: settings.applicationsIntroMarkdown,
          })} 
          disabled={saving} 
        />
      </div>
    </Card>
  );
});

