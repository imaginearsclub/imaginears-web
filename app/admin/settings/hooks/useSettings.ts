import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export type Settings = {
  siteName: string;
  timezone: string;
  homepageIntro: string;
  footerMarkdown: string;
  aboutMarkdown: string;
  applicationsIntroMarkdown: string;
  branding: { logoUrl: string; bannerUrl: string; accentHex: string };
  events: {
    defaultCategory: "Fireworks" | "Seasonal" | "MeetAndGreet" | "Parade" | "Other";
    recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
    byWeekday: ("SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA")[];
    times: string[];
  };
  applications: { turnstileSiteKey: string; allowApplications: boolean };
  social: { twitter?: string; instagram?: string; discord?: string; youtube?: string; facebook?: string; tiktok?: string };
  seo: { title?: string; description?: string; image?: string; twitterCard?: string };
  features: { showEventsOnHome: boolean; showApplicationsOnHome: boolean };
  notifications: {
    discordWebhookUrl: string;
    discordApplicationsWebhookUrl: string;
    discordEventsWebhookUrl: string;
    notifyOnNewApplication: boolean;
    notifyOnNewEvent: boolean;
    emailNotifications: boolean;
    adminEmail: string;
  };
  maintenance: { enabled: boolean; message: string; allowedIPs: string[] };
  security: { rateLimitEnabled: boolean; maxRequestsPerMinute: number; requireEmailVerification: boolean };
  updatedAt?: string;
};

const DEFAULT_SETTINGS: Settings = {
  siteName: "Imaginears",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
  homepageIntro: "",
  footerMarkdown: "",
  aboutMarkdown: "",
  applicationsIntroMarkdown: "",
  branding: { logoUrl: "", bannerUrl: "", accentHex: "#3b82f6" },
  events: { defaultCategory: "Other", recurrenceFreq: "NONE", byWeekday: [], times: [] },
  applications: { turnstileSiteKey: "", allowApplications: true },
  social: {},
  seo: { twitterCard: "summary_large_image" },
  features: { showEventsOnHome: true, showApplicationsOnHome: true },
  notifications: {
    discordWebhookUrl: "",
    discordApplicationsWebhookUrl: "",
    discordEventsWebhookUrl: "",
    notifyOnNewApplication: true,
    notifyOnNewEvent: false,
    emailNotifications: false,
    adminEmail: "",
  },
  maintenance: { enabled: false, message: "We'll be back soon!", allowedIPs: [] },
  security: { rateLimitEnabled: true, maxRequestsPerMinute: 60, requireEmailVerification: false },
};

export function useSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSettings({
        ...DEFAULT_SETTINGS,
        ...data,
        branding: { ...DEFAULT_SETTINGS.branding, ...data.branding },
        events: { ...DEFAULT_SETTINGS.events, ...data.events },
        applications: { ...DEFAULT_SETTINGS.applications, ...data.applications },
        social: { ...DEFAULT_SETTINGS.social, ...data.social },
        seo: { ...DEFAULT_SETTINGS.seo, ...data.seo },
        features: { ...DEFAULT_SETTINGS.features, ...data.features },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...data.notifications },
        maintenance: { ...DEFAULT_SETTINGS.maintenance, ...data.maintenance },
        security: { ...DEFAULT_SETTINGS.security, ...data.security },
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (partial: Partial<Settings>) => {
      setSaving(true);

      const savePromise = (async () => {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(partial),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.error || `HTTP ${res.status}`);
        }

        await load();
      })();

      toast.promise(savePromise, {
        loading: "Saving settings...",
        success: "Settings saved successfully!",
        error: (err) => err.message || "Failed to save settings",
      });

      try {
        await savePromise;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return { settings, setSettings, loading, saving, save };
}

