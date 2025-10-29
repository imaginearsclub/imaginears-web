import { memo } from "react";
import { GeneralTab } from "../tabs/GeneralTab";
import { BrandingTab } from "../tabs/BrandingTab";
import { ContentTab } from "../tabs/ContentTab";
import { EventsTab } from "../tabs/EventsTab";
import { ApplicationsTab } from "../tabs/ApplicationsTab";
import { SocialSeoTab } from "../tabs/SocialSeoTab";
import { NotificationsTab } from "../tabs/NotificationsTab";
import { SecurityTab } from "../tabs/SecurityTab";
import type { Settings } from "../hooks/useSettings";

interface TabRendererProps {
  tab: string;
  settings: Settings;
  /* eslint-disable-next-line no-unused-vars */
  setSettings: (settings: Settings) => void;
  /* eslint-disable-next-line no-unused-vars */
  save: (partial: Partial<Settings>) => Promise<void>;
  saving: boolean;
}

export const TabRenderer = memo(function TabRenderer({
  tab,
  settings,
  setSettings,
  save,
  saving,
}: TabRendererProps) {
  if (tab === "general") {
    return (
      <GeneralTab
        settings={{ siteName: settings.siteName, timezone: settings.timezone, features: settings.features }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "branding") {
    return (
      <BrandingTab
        settings={{ branding: settings.branding }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "content") {
    return (
      <ContentTab
        settings={{
          homepageIntro: settings.homepageIntro,
          footerMarkdown: settings.footerMarkdown,
          aboutMarkdown: settings.aboutMarkdown,
          applicationsIntroMarkdown: settings.applicationsIntroMarkdown,
        }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "events") {
    return (
      <EventsTab
        settings={{ events: settings.events }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "applications") {
    return (
      <ApplicationsTab
        settings={{ applications: settings.applications, notifications: settings.notifications }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "socialseo") {
    return (
      <SocialSeoTab
        settings={{ social: settings.social, seo: settings.seo }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "notifications") {
    return (
      <NotificationsTab
        settings={{ notifications: settings.notifications }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  if (tab === "security") {
    return (
      <SecurityTab
        settings={{ maintenance: settings.maintenance, security: settings.security }}
        onChange={(partial) => setSettings({ ...settings, ...partial })}
        onSave={(data) => save(data)}
        saving={saving}
      />
    );
  }

  return null;
});

