"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, Home, CalendarRange, FileText, Users, Settings } from "lucide-react";
import { SidebarDesktop, SidebarDrawer } from "@/components/admin/Sidebar";
import { CommandPalette } from "@/components/common";
import type { CommandItem } from "@/components/common";
import { useRouter } from "next/navigation";

export default function AdminChrome({ children }: { children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const router = useRouter();

    // Command palette items
    const commandItems: CommandItem[] = [
        {
            id: "dashboard",
            label: "Dashboard",
            description: "View dashboard overview and statistics",
            icon: <Home className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/dashboard"),
            keywords: ["home", "overview", "stats"],
        },
        {
            id: "events",
            label: "Events",
            description: "Manage events and schedules",
            icon: <CalendarRange className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/events"),
            keywords: ["calendar", "schedule"],
        },
        {
            id: "applications",
            label: "Applications",
            description: "Review and manage applications",
            icon: <FileText className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/applications"),
            keywords: ["apps", "review", "approve"],
        },
        {
            id: "players",
            label: "Players",
            description: "Manage player accounts",
            icon: <Users className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/players"),
            keywords: ["users", "members"],
        },
        {
            id: "organizations",
            label: "Organizations",
            description: "Manage organizations and teams",
            icon: <Users className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/organizations"),
            keywords: ["orgs", "teams"],
        },
        {
            id: "settings",
            label: "Settings",
            description: "Configure application settings",
            icon: <Settings className="w-4 h-4" />,
            shortcut: "⌘,",
            group: "Settings",
            onSelect: () => router.push("/admin/settings"),
            keywords: ["preferences", "config"],
        },
        {
            id: "components",
            label: "Components Demo",
            description: "View all UI components",
            icon: <Settings className="w-4 h-4" />,
            group: "Tools",
            onSelect: () => router.push("/admin/components-demo"),
            keywords: ["ui", "design", "showcase"],
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/70 backdrop-blur">
                <div className="container flex items-center justify-between py-3">
                    <button
                        className="md:hidden btn btn-icon btn-ghost"
                        aria-label="Open menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <h1 className="text-base md:text-lg font-semibold tracking-tight">
                        Admin
                        <span className="ml-2 text-slate-500 dark:text-slate-400 hidden sm:inline">
              / {process.env.NODE_ENV === "development" ? "Dev" : "Live"}
            </span>
                    </h1>
                    {/* Command Palette Trigger */}
                    <div className="flex items-center gap-2">
                        <CommandPalette items={commandItems} />
                    </div>
                </div>
            </header>

            <main className="container py-6">
                <div className="grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-6">
                    {/* Desktop-only sidebar */}
                    <SidebarDesktop />

                    {/* Page content */}
                    <section>{children}</section>
                </div>
            </main>

            {/* Mobile drawer (separate component) */}
            <SidebarDrawer open={mobileOpen} onCloseAction={() => setMobileOpen(false)} />
        </div>
    );
}
