"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
    MarkdownEditor, 
    Input, 
    Switch, 
    Spinner,
    Separator 
} from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";
import { 
    Save, 
    Info, 
    AlertCircle, 
    Settings as SettingsIcon,
    Palette,
    FileText,
    Calendar,
    UserPlus,
    Share2,
    Bell,
    Shield,
    ChevronRight
} from "lucide-react";

type Branding = { logoUrl: string; bannerUrl: string; accentHex: string };
type EventsCfg = {
    defaultCategory: "Fireworks" | "Seasonal" | "MeetAndGreet" | "Parade" | "Other";
    recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
    byWeekday: ("SU"|"MO"|"TU"|"WE"|"TH"|"FR"|"SA")[];
    times: string[];
};
type ApplicationsCfg = { turnstileSiteKey: string; allowApplications: boolean };
type SocialCfg = { twitter?: string; instagram?: string; discord?: string; youtube?: string; facebook?: string; tiktok?: string };
type SeoCfg = { title?: string; description?: string; image?: string; twitterCard?: string };
type FeaturesCfg = { showEventsOnHome: boolean; showApplicationsOnHome: boolean };
type NotificationsCfg = { 
    discordWebhookUrl: string; // Legacy/general webhook
    discordApplicationsWebhookUrl: string;
    discordEventsWebhookUrl: string;
    notifyOnNewApplication: boolean; 
    notifyOnNewEvent: boolean;
    emailNotifications: boolean;
    adminEmail: string;
};
type MaintenanceCfg = { 
    enabled: boolean; 
    message: string; 
    allowedIPs: string[];
};
type SecurityCfg = {
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
    requireEmailVerification: boolean;
};

type Settings = {
    siteName: string;
    timezone: string;
    homepageIntro: string;
    footerMarkdown: string;
    aboutMarkdown: string;
    applicationsIntroMarkdown: string;
    branding: Branding;
    events: EventsCfg;
    applications: ApplicationsCfg;
    social: SocialCfg;
    seo: SeoCfg;
    features: FeaturesCfg;
    notifications: NotificationsCfg;
    maintenance: MaintenanceCfg;
    security: SecurityCfg;
    updatedAt?: string;
};

const WEEKDAYS = ["SU","MO","TU","WE","TH","FR","SA"] as const;

const TAB_OPTIONS = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "content", label: "Content", icon: FileText },
    { id: "events", label: "Events", icon: Calendar },
    { id: "applications", label: "Applications", icon: UserPlus },
    { id: "socialseo", label: "Social & SEO", icon: Share2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
    const [tab, setTab] = useState("general");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<Settings>({
        siteName: "Imaginears",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
        homepageIntro: "",
        footerMarkdown: "",
        aboutMarkdown: "",
        applicationsIntroMarkdown: "",
        branding: { logoUrl: "", bannerUrl: "", accentHex: "#3b82f6" },
        events: { defaultCategory: "Other", recurrenceFreq: "NONE", byWeekday: [], times: [] },
        applications: { turnstileSiteKey: "", allowApplications: true },
        social: { twitter: "", instagram: "", discord: "", youtube: "", facebook: "", tiktok: "" },
        seo: { title: "", description: "", image: "", twitterCard: "summary_large_image" },
        features: { showEventsOnHome: true, showApplicationsOnHome: true },
        notifications: { 
            discordWebhookUrl: "",
            discordApplicationsWebhookUrl: "",
            discordEventsWebhookUrl: "",
            notifyOnNewApplication: true, 
            notifyOnNewEvent: false,
            emailNotifications: false,
            adminEmail: ""
        },
        maintenance: { enabled: false, message: "We'll be back soon!", allowedIPs: [] },
        security: { rateLimitEnabled: true, maxRequestsPerMinute: 60, requireEmailVerification: false },
    });

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/settings", { 
                cache: "no-store",
                credentials: "include"
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setSettings({
                siteName: data.siteName || "Imaginears",
                timezone: data.timezone || "America/New_York",
                homepageIntro: data.homepageIntro ?? "",
                footerMarkdown: data.footerMarkdown ?? "",
                aboutMarkdown: data.aboutMarkdown ?? "",
                applicationsIntroMarkdown: data.applicationsIntroMarkdown ?? "",
                branding: data.branding ?? { logoUrl: "", bannerUrl: "", accentHex: "#3b82f6" },
                events: data.events ?? { defaultCategory: "Other", recurrenceFreq: "NONE", byWeekday: [], times: [] },
                applications: data.applications ?? { turnstileSiteKey: "", allowApplications: true },
                social: data.social ?? { twitter: "", instagram: "", discord: "", youtube: "", facebook: "", tiktok: "" },
                seo: data.seo ?? { title: "", description: "", image: "", twitterCard: "summary_large_image" },
                features: data.features ?? { showEventsOnHome: true, showApplicationsOnHome: true },
                notifications: data.notifications ?? { 
                    discordWebhookUrl: "",
                    discordApplicationsWebhookUrl: "",
                    discordEventsWebhookUrl: "",
                    notifyOnNewApplication: true, 
                    notifyOnNewEvent: false,
                    emailNotifications: false,
                    adminEmail: ""
                },
                maintenance: data.maintenance ?? { enabled: false, message: "We'll be back soon!", allowedIPs: [] },
                security: data.security ?? { rateLimitEnabled: true, maxRequestsPerMinute: 60, requireEmailVerification: false },
                updatedAt: data.updatedAt,
            });
        } catch (e: any) {
            toast.error(e.message || "Failed to load settings");
            console.error("[Settings] Load error:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function save(partial: Partial<Settings>) {
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
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <PageHeader
                title="Settings"
                description="Configure your Imaginears application • Customize site behavior and features"
                icon={<SettingsIcon className="w-6 h-6" />}
                badge={settings.updatedAt ? {
                    label: `Updated ${new Date(settings.updatedAt).toLocaleDateString()}`,
                    variant: "info"
                } : undefined}
                breadcrumbs={[
                    { label: "Dashboard", href: "/admin/dashboard" },
                    { label: "Settings" }
                ]}
            />

            <div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar Navigation */}
                    <nav className="lg:col-span-3 space-y-1">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                            {TAB_OPTIONS.map((tabOption) => {
                                const Icon = tabOption.icon;
                                const isActive = tab === tabOption.id;
                                return (
                                    <button
                                        key={tabOption.id}
                                        onClick={() => setTab(tabOption.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                            isActive
                                                ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span className="flex-1 text-left">{tabOption.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* GENERAL */}
                        {tab === "general" && (
                            <Card>
                                <CardHeader 
                                    title="General Settings" 
                                    description="Basic configuration for your site"
                                />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Site Name">
                                            <Input
                                                value={settings.siteName}
                                                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                                                placeholder="Enter site name"
                                            />
                                        </Field>
                                        <Field label="Timezone">
                                            <select 
                                                className={inputClass}
                                                value={settings.timezone}
                                                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                                            >
                                                {(Intl as any).supportedValuesOf?.("timeZone")?.map((tz: string) => (
                                                    <option key={tz} value={tz}>{tz}</option>
                                                )) || <option>America/New_York</option>}
                                            </select>
                                        </Field>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                            <div>
                                                <label className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Show Events on Homepage
                                                </label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Display events section on the homepage
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.features.showEventsOnHome}
                                                onCheckedChange={(checked) => setSettings({
                                                    ...settings, 
                                                    features: {...settings.features, showEventsOnHome: checked}
                                                })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                            <div>
                                                <label className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Show Applications on Homepage
                                                </label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Display application form section on the homepage
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.features.showApplicationsOnHome}
                                                onCheckedChange={(checked) => setSettings({
                                                    ...settings, 
                                                    features: {...settings.features, showApplicationsOnHome: checked}
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <SaveButton 
                                        onClick={() => save({
                                            siteName: settings.siteName,
                                            timezone: settings.timezone,
                                            features: settings.features
                                        })}
                                        disabled={saving}
                                    />
                                </div>
                            </Card>
                        )}

                        {/* BRANDING */}
                        {tab === "branding" && (
                            <Card>
                                <CardHeader 
                                    title="Branding" 
                                    description="Customize your site's appearance"
                                />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Logo URL">
                                            <Input
                                                value={settings.branding.logoUrl}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    branding: {...settings.branding, logoUrl: e.target.value}
                                                })}
                                                placeholder="https://example.com/logo.png"
                                            />
                                        </Field>
                                        <Field label="Banner URL">
                                            <Input
                                                value={settings.branding.bannerUrl}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    branding: {...settings.branding, bannerUrl: e.target.value}
                                                })}
                                                placeholder="https://example.com/banner.png"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Accent Color (Hex)">
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                value={settings.branding.accentHex}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    branding: {...settings.branding, accentHex: e.target.value}
                                                })}
                                                placeholder="#3b82f6"
                                                className="flex-1"
                                            />
                                            <div 
                                                className="w-16 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-700"
                                                style={{ backgroundColor: settings.branding.accentHex }}
                                            />
                                        </div>
                                    </Field>

                                    <SaveButton 
                                        onClick={() => save({ branding: settings.branding })}
                                        disabled={saving}
                                    />
                                </div>
                            </Card>
                        )}

                        {/* CONTENT */}
                    {tab === "content" && (
                        <Card>
                    <CardHeader 
                        title="Content" 
                        description="Manage markdown content for various pages"
                    />
                    <div className="space-y-4">
                            <MarkdownEditor
                            label="Homepage Intro"
                            value={settings.homepageIntro}
                            onChange={(v) => setSettings({...settings, homepageIntro: v})}
                                rows={10}
                            />
                            <MarkdownEditor
                            label="Footer Content"
                            value={settings.footerMarkdown}
                            onChange={(v) => setSettings({...settings, footerMarkdown: v})}
                                rows={8}
                            />
                            <MarkdownEditor
                            label="About Page"
                            value={settings.aboutMarkdown}
                            onChange={(v) => setSettings({...settings, aboutMarkdown: v})}
                                rows={12}
                            />
                            <MarkdownEditor
                            label="Applications Intro"
                            value={settings.applicationsIntroMarkdown}
                            onChange={(v) => setSettings({...settings, applicationsIntroMarkdown: v})}
                                rows={8}
                            />

                        <SaveButton 
                            onClick={() => save({
                                homepageIntro: settings.homepageIntro,
                                footerMarkdown: settings.footerMarkdown,
                                aboutMarkdown: settings.aboutMarkdown,
                                applicationsIntroMarkdown: settings.applicationsIntroMarkdown,
                            })}
                            disabled={saving}
                        />
                            </div>
                        </Card>
                    )}

                        {/* EVENTS */}
                    {tab === "events" && (
                        <Card>
                    <CardHeader 
                        title="Event Defaults" 
                        description="Default values for creating new events"
                    />
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Default Category">
                                <select 
                                    className={inputClass}
                                    value={settings.events.defaultCategory}
                                    onChange={(e) => setSettings({
                                        ...settings, 
                                        events: {...settings.events, defaultCategory: e.target.value as EventsCfg["defaultCategory"]}
                                    })}
                                >
                                        <option value="Fireworks">Fireworks</option>
                                        <option value="Seasonal">Seasonal</option>
                                        <option value="MeetAndGreet">Meet & Greet</option>
                                        <option value="Parade">Parade</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </Field>
                            <Field label="Default Recurrence">
                                <select 
                                    className={inputClass}
                                    value={settings.events.recurrenceFreq}
                                    onChange={(e) => setSettings({
                                        ...settings, 
                                        events: {...settings.events, recurrenceFreq: e.target.value as EventsCfg["recurrenceFreq"]}
                                    })}
                                >
                                        <option value="NONE">One-time</option>
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                    </select>
                                </Field>
                            </div>

                        {settings.events.recurrenceFreq === "WEEKLY" && (
                            <Field label="Default Weekly Days">
                                <div className="flex gap-2 flex-wrap">
                                    {WEEKDAYS.map((d) => {
                                        const active = settings.events.byWeekday.includes(d);
                                            return (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => {
                                                    const set = new Set(settings.events.byWeekday);
                                                    if (active) {
                                                        set.delete(d);
                                                    } else {
                                                        set.add(d);
                                                    }
                                                    setSettings({
                                                        ...settings, 
                                                        events: {...settings.events, byWeekday: Array.from(set) as any}
                                                    });
                                                }}
                                                className={cn(
                                                    "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all",
                                                    active
                                                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                                                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                                                )}
                                            >
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                            </Field>
                            )}

                        <Field label="Default Showtimes">
                                <TimesEditor
                                times={settings.events.times}
                                onChange={(times) => setSettings({...settings, events: {...settings.events, times}})}
                            />
                        </Field>

                        <SaveButton 
                            onClick={() => save({ events: settings.events })}
                            disabled={saving}
                        />
                            </div>
                        </Card>
                    )}

                    {/* APPLICATIONS */}
                    {tab === "applications" && (
                        <Card>
                    <CardHeader 
                        title="Applications" 
                        description="Configure application settings and spam protection"
                    />
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
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            applications: {...settings.applications, turnstileSiteKey: e.target.value}
                                        })}
                                        placeholder="0x4AAAAAAA..."
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                        <Info className="w-3.5 h-3.5" />
                                        Public key for Cloudflare Turnstile CAPTCHA
                                    </p>
                                </Field>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div>
                                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                                            Allow Applications
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Enable or disable the public application form
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.applications.allowApplications}
                                        onCheckedChange={(checked) => setSettings({
                                            ...settings, 
                                            applications: {...settings.applications, allowApplications: checked}
                                        })}
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
                                    onChange={(e) => setSettings({
                                        ...settings, 
                                        notifications: {...settings.notifications, discordApplicationsWebhookUrl: e.target.value}
                                    })}
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
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings, 
                                        notifications: {...settings.notifications, notifyOnNewApplication: checked}
                                    })}
                                />
                            </div>
                        </div>

                        <SaveButton 
                            onClick={() => save({ 
                                applications: settings.applications,
                                notifications: settings.notifications 
                            })}
                            disabled={saving}
                        />
                            </div>
                        </Card>
                    )}

                    {/* SOCIAL & SEO */}
                    {tab === "socialseo" && (
                        <Card>
                    <CardHeader 
                        title="Social & SEO" 
                        description="Social media links and SEO metadata"
                    />
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
                                Social Media Links
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(["twitter", "instagram", "discord", "youtube", "facebook", "tiktok"] as const).map((platform) => (
                                    <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                                        <Input
                                            value={settings.social[platform] || ""}
                                            onChange={(e) => setSettings({
                                                ...settings, 
                                                social: {...settings.social, [platform]: e.target.value}
                                            })}
                                            placeholder={`https://${platform}.com/...`}
                                        />
                                    </Field>
                                ))}
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
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            seo: {...settings.seo, title: e.target.value}
                                        })}
                                        placeholder="Default page title"
                                    />
                                </Field>
                                <Field label="SEO Description">
                                    <Input
                                        value={settings.seo.description || ""}
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            seo: {...settings.seo, description: e.target.value}
                                        })}
                                        placeholder="Default meta description"
                                    />
                                </Field>
                                <Field label="SEO Image URL">
                                    <Input
                                        value={settings.seo.image || ""}
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            seo: {...settings.seo, image: e.target.value}
                                        })}
                                        placeholder="https://example.com/og-image.png"
                                    />
                                </Field>
                                <Field label="Twitter Card Type">
                                    <select 
                                        className={inputClass}
                                        value={settings.seo.twitterCard || "summary_large_image"}
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            seo: {...settings.seo, twitterCard: e.target.value}
                                        })}
                                    >
                                        <option value="summary_large_image">Large Image</option>
                                        <option value="summary">Summary</option>
                                    </select>
                                </Field>
                            </div>
                        </div>

                        <SaveButton 
                            onClick={() => save({ social: settings.social, seo: settings.seo })}
                            disabled={saving}
                        />
                    </div>
                </Card>
                        )}

                        {/* NOTIFICATIONS */}
                        {tab === "notifications" && (
                <Card>
                    <CardHeader 
                        title="Notifications" 
                        description="Configure event notifications and email settings"
                    />
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
                                Event Notifications
                            </h3>
                            <Field label="Events Discord Webhook URL">
                                <Input
                                    value={settings.notifications.discordEventsWebhookUrl}
                                    onChange={(e) => setSettings({
                                        ...settings, 
                                        notifications: {...settings.notifications, discordEventsWebhookUrl: e.target.value}
                                    })}
                                    placeholder="https://discord.com/api/webhooks/..."
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5" />
                                    Discord webhook for new event notifications
                                </p>
                            </Field>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                                        Notify on New Event
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Send Discord notification when a new event is created
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.notifications.notifyOnNewEvent}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings, 
                                        notifications: {...settings.notifications, notifyOnNewEvent: checked}
                                    })}
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
                                        onCheckedChange={(checked) => setSettings({
                                            ...settings, 
                                            notifications: {...settings.notifications, emailNotifications: checked}
                                        })}
                                    />
                                </div>
                                <Field label="Admin Email">
                                    <Input
                                        type="email"
                                        value={settings.notifications.adminEmail}
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            notifications: {...settings.notifications, adminEmail: e.target.value}
                                        })}
                                        placeholder="admin@example.com"
                                    />
                                </Field>
                            </div>
                        </div>

                        <SaveButton 
                            onClick={() => save({ notifications: settings.notifications })}
                            disabled={saving}
                        />
                            </div>
                        </Card>
                    )}

                        {/* SECURITY & MAINTENANCE */}
                    {tab === "security" && (
                        <Card>
                    <CardHeader 
                        title="Security & Maintenance" 
                        description="Configure security settings and maintenance mode"
                    />
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-amber-600 dark:bg-amber-500 rounded-full" />
                                Maintenance Mode
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
                                    <div>
                                        <label className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Maintenance Mode
                                        </label>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                            Show maintenance page to non-admin users
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.maintenance.enabled}
                                        onCheckedChange={(checked) => setSettings({
                                            ...settings, 
                                            maintenance: {...settings.maintenance, enabled: checked}
                                        })}
                                    />
                                </div>
                                <Field label="Maintenance Message">
                                    <Input
                                        value={settings.maintenance.message}
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            maintenance: {...settings.maintenance, message: e.target.value}
                                        })}
                                        placeholder="We'll be back soon!"
                                    />
                                </Field>
                                <Field label="Allowed IPs (Bypass Maintenance)">
                                    <Input
                                        value={settings.maintenance.allowedIPs.join(", ")}
                                        onChange={(e) => {
                                            const ips = e.target.value.split(",").map(ip => ip.trim()).filter(Boolean);
                                            setSettings({
                                                ...settings, 
                                                maintenance: {...settings.maintenance, allowedIPs: ips}
                                            });
                                        }}
                                        placeholder="192.168.1.1, 10.0.0.1"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                        <Info className="w-3.5 h-3.5" />
                                        Comma-separated list of IP addresses that can bypass maintenance mode
                                    </p>
                                </Field>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full" />
                                Security Settings
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div>
                                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                                            Rate Limiting
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Limit API requests to prevent abuse
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.security.rateLimitEnabled}
                                        onCheckedChange={(checked) => setSettings({
                                            ...settings, 
                                            security: {...settings.security, rateLimitEnabled: checked}
                                        })}
                                    />
                                </div>
                                <Field label="Max Requests Per Minute">
                                    <Input
                                        type="number"
                                        min={10}
                                        max={1000}
                                        value={settings.security.maxRequestsPerMinute}
                                        onChange={(e) => setSettings({
                                            ...settings, 
                                            security: {...settings.security, maxRequestsPerMinute: parseInt(e.target.value) || 60}
                                        })}
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Recommended: 60-120 requests per minute
                                    </p>
                                </Field>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div>
                                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                                            Require Email Verification
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Users must verify their email before accessing features
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.security.requireEmailVerification}
                                        onCheckedChange={(checked) => setSettings({
                                            ...settings, 
                                            security: {...settings.security, requireEmailVerification: checked}
                                        })}
                                    />
                                </div>
                            </div>
                        </div>

                        <SaveButton 
                            onClick={() => save({ maintenance: settings.maintenance, security: settings.security })}
                            disabled={saving}
                        />
                    </div>
                        </Card>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- UI Components --- */
const inputClass = cn(
    "w-full rounded-xl border-2 px-4 py-3",
    "border-slate-300 dark:border-slate-700",
    "bg-white dark:bg-slate-900",
    "text-slate-900 dark:text-white",
    "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
    "transition-all"
);

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
            {children}
            </div>
        </div>
    );
}

function CardHeader({ title, description }: { title: string; description: string }) {
    return (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 -mt-6 -mx-6 px-6 pt-6 bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            {children}
        </div>
    );
}

function SaveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
    return (
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
                    "bg-blue-600 dark:bg-blue-500 text-white",
                    "hover:bg-blue-700 dark:hover:bg-blue-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {disabled ? (
                    <>
                        <Spinner size="sm" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Changes
                    </>
                )}
            </button>
        </div>
    );
}

function TimesEditor({ times, onChange }: { times: string[]; onChange: (t: string[]) => void }) {
    function add(t = "00:00") {
        const set = new Set([...times, t]);
        onChange(Array.from(set).sort());
    }
    
    function update(i: number, t: string) {
        const next = [...times];
        next[i] = t;
        onChange(next.sort());
    }
    
    function remove(i: number) {
        onChange(times.filter((_, idx) => idx !== i));
    }
    
    const displayTimes = times.length > 0 ? times : ["15:00"];
    
    return (
        <div className="space-y-2">
            {displayTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="time"
                        value={t}
                        onChange={(e) => update(i, e.target.value)}
                        className={cn(inputClass, "w-40")}
                        step={60}
                    />
                    <button
                        type="button"
                        onClick={() => remove(i)}
                        className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
                            "border border-red-200 dark:border-red-800",
                            "hover:bg-red-100 dark:hover:bg-red-900/30"
                        )}
                    >
                        Remove
                    </button>
                </div>
            ))}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => add("00:00")}
                    className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                        "hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                >
                    + Add Time
                </button>
                <button
                    type="button"
                    onClick={() => onChange(["15:00", "18:00", "21:00"])}
                    className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                        "hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                >
                    Set 3p/6p/9p
                </button>
            </div>
        </div>
    );
}
