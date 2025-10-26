"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, Home, CalendarRange, FileText, Users, Settings, Plus, Search, Moon, Sun, Palette, LogOut, Code, UserCog, User, Shield, Activity, HeartPulse, BookOpen, UsersRound } from "lucide-react";
import { SidebarDesktop, SidebarDrawer } from "@/components/admin/Sidebar";
import { CommandPalette, Badge } from "@/components/common";
import type { CommandItem } from "@/components/common";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
            id: "staff",
            label: "Cast Members",
            description: "Manage staff accounts and Minecraft usernames",
            icon: <UserCog className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/staff"),
            keywords: ["staff", "employees", "team", "minecraft", "cast"],
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
            id: "roles",
            label: "User Roles",
            description: "Configure roles and permissions (RBAC)",
            icon: <Shield className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/roles/configure"),
            keywords: ["rbac", "permissions", "access", "security", "custom roles"],
        },
        {
            id: "bulk-users",
            label: "Bulk User Management",
            description: "Manage multiple users at once",
            icon: <UsersRound className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/users/bulk"),
            keywords: ["bulk", "batch", "multiple", "operations", "suspend", "activate"],
        },
        {
            id: "sessions",
            label: "Sessions",
            description: "Monitor and manage user sessions",
            icon: <Activity className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/sessions"),
            keywords: ["active", "monitoring", "security", "logins", "devices"],
        },
        {
            id: "sessions-policies",
            label: "Session Policies",
            description: "Configure session security policies",
            icon: <Shield className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/sessions/policies"),
            keywords: ["policies", "security", "rules", "restrictions", "access"],
        },
        {
            id: "sessions-health",
            label: "Session Health",
            description: "Monitor session system health and performance",
            icon: <HeartPulse className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/sessions/health"),
            keywords: ["health", "performance", "metrics", "monitoring", "diagnostics"],
        },
        {
            id: "api-docs",
            label: "API Documentation",
            description: "View interactive API documentation",
            icon: <BookOpen className="w-4 h-4" />,
            group: "Navigation",
            onSelect: () => router.push("/admin/api-docs"),
            keywords: ["api", "docs", "documentation", "endpoints", "reference"],
        },
        {
            id: "profile",
            label: "My Profile",
            description: "Manage your account and personal settings",
            icon: <User className="w-4 h-4" />,
            group: "Settings",
            onSelect: () => router.push("/profile"),
            keywords: ["account", "personal", "minecraft", "password"],
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
            icon: <Palette className="w-4 h-4" />,
            group: "Tools",
            onSelect: () => router.push("/admin/components-demo"),
            keywords: ["ui", "design", "showcase"],
        },
        // Quick Actions
        {
            id: "new-event",
            label: "Create New Event",
            description: "Add a new event to the schedule",
            icon: <Plus className="w-4 h-4" />,
            group: "Quick Actions",
            onSelect: () => router.push("/admin/events?action=create"),
            keywords: ["add", "event", "calendar", "new"],
        },
        {
            id: "create-role",
            label: "Create Custom Role",
            description: "Create a new custom role with specific permissions",
            icon: <Plus className="w-4 h-4" />,
            group: "Quick Actions",
            onSelect: () => router.push("/admin/roles/configure"),
            keywords: ["add", "role", "permissions", "rbac", "custom", "new"],
        },
        {
            id: "bulk-operations",
            label: "Bulk User Operations",
            description: "Perform operations on multiple users",
            icon: <UsersRound className="w-4 h-4" />,
            group: "Quick Actions",
            onSelect: () => router.push("/admin/users/bulk"),
            keywords: ["bulk", "suspend", "activate", "batch", "multiple"],
        },
        {
            id: "search-apps",
            label: "Search Applications",
            description: "Find and filter applications",
            icon: <Search className="w-4 h-4" />,
            group: "Quick Actions",
            onSelect: () => router.push("/admin/applications"),
            keywords: ["find", "lookup", "filter", "apps"],
        },
        {
            id: "search-players",
            label: "Search Players",
            description: "Find player accounts",
            icon: <Search className="w-4 h-4" />,
            group: "Quick Actions",
            onSelect: () => router.push("/admin/players"),
            keywords: ["find", "users", "members", "lookup"],
        },
        {
            id: "search-sessions",
            label: "Search Sessions",
            description: "Find and monitor active sessions",
            icon: <Search className="w-4 h-4" />,
            group: "Quick Actions",
            onSelect: () => router.push("/admin/sessions"),
            keywords: ["find", "sessions", "active", "monitoring", "security"],
        },
        // Theme Controls
        {
            id: "toggle-theme-light",
            label: "Switch to Light Mode",
            description: "Change theme to light mode",
            icon: <Sun className="w-4 h-4" />,
            group: "Theme",
            onSelect: () => {
                document.documentElement.classList.remove("dark");
                sessionStorage.setItem("imaginears.theme", "light");
                window.dispatchEvent(new Event("storage"));
            },
            keywords: ["theme", "appearance", "bright", "light"],
        },
        {
            id: "toggle-theme-dark",
            label: "Switch to Dark Mode",
            description: "Change theme to dark mode",
            icon: <Moon className="w-4 h-4" />,
            group: "Theme",
            onSelect: () => {
                document.documentElement.classList.add("dark");
                sessionStorage.setItem("imaginears.theme", "dark");
                window.dispatchEvent(new Event("storage"));
            },
            keywords: ["theme", "appearance", "night", "dark"],
        },
        // System Actions
        {
            id: "view-source",
            label: "View Page Source",
            description: "Inspect page source code",
            icon: <Code className="w-4 h-4" />,
            group: "System",
            onSelect: () => {
                if (typeof window !== "undefined") {
                    window.open("view-source:" + window.location.href, "_blank");
                }
            },
            keywords: ["dev", "inspect", "debug", "developer"],
        },
        {
            id: "logout",
            label: "Sign Out",
            description: "Log out of your account",
            icon: <LogOut className="w-4 h-4" />,
            group: "System",
            onSelect: () => router.push("/logout"),
            keywords: ["exit", "leave", "signout", "logout"],
        },
    ];

    return (
        <div className="min-h-screen">
            {/* Top bar */}
            <header className={cn(
                "sticky top-0 z-30",
                "border-b border-slate-200/70 dark:border-slate-800/60",
                "bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm"
            )}>
                <div className="container flex items-center justify-between py-3 gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            className={cn(
                                "md:hidden inline-flex items-center justify-center",
                                "h-9 w-9 rounded-lg",
                                "text-slate-700 dark:text-slate-300",
                                "hover:bg-slate-100 dark:hover:bg-slate-800",
                                "transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            )}
                            aria-label="Open menu"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                Admin
                            </h1>
                            <Badge 
                                variant={process.env.NODE_ENV === "development" ? "warning" : "success"}
                                size="sm"
                                className="hidden sm:inline-flex"
                            >
                                {process.env.NODE_ENV === "development" ? "Dev" : "Live"}
                            </Badge>
                        </div>
                    </div>
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
