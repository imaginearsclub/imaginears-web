"use client";

import { useState } from "react";
import { Spinner } from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";
import { 
    Settings as SettingsIcon,
    Palette,
    FileText,
    Calendar,
    UserPlus,
    Share2,
    Bell,
    Shield,
  ChevronRight,
} from "lucide-react";
import { useSettings } from "./hooks/useSettings";
import { TabRenderer } from "./components/TabRenderer";

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
  const { settings, setSettings, loading, saving, save } = useSettings();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title="Settings"
                description="Configure your Imaginears application • Customize site behavior and features"
                icon={<SettingsIcon className="w-6 h-6" />}
        badge={
          settings.updatedAt
            ? { label: `Updated ${new Date(settings.updatedAt).toLocaleDateString()}`, variant: "info" as const }
            : { label: "", variant: "default" as const }
        }
        breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Settings" }]}
      />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
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
          <TabRenderer tab={tab} settings={settings} setSettings={setSettings} save={save} saving={saving} />
        </div>
                </div>
        </div>
    );
}

