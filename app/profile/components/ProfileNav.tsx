"use client";

import { User, Shield, Link2, Lock, FileText, Key } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import SignOutButton from "@/components/admin/SignOutButton";

export type ProfileSection = "general" | "security" | "connections" | "applications" | "api-keys" | "privacy";

interface NavItem {
  id: ProfileSection;
  title: string;
  icon: LucideIcon;
  description: string;
  requiresStaff?: boolean; // Only show for staff/admin users
}

const navItems: NavItem[] = [
  {
    id: "general",
    title: "General",
    icon: User,
    description: "Profile information & preferences",
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    description: "Password, 2FA & sessions",
  },
  {
    id: "connections",
    title: "Connections",
    icon: Link2,
    description: "Minecraft & connected accounts",
  },
  {
    id: "applications",
    title: "Applications",
    icon: FileText,
    description: "View your application history",
  },
  {
    id: "api-keys",
    title: "API Keys",
    icon: Key,
    description: "Manage programmatic access",
    requiresStaff: true,
  },
  {
    id: "privacy",
    title: "Privacy",
    icon: Lock,
    description: "Data management & GDPR",
  },
];

interface ProfileNavProps {
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
  userRole: string;
}

export function ProfileNav({ activeSection, onSectionChange, userRole }: ProfileNavProps) {
  const isStaff = ["OWNER", "ADMIN", "MODERATOR", "STAFF"].includes(userRole);

  // Filter nav items based on staff requirement
  const visibleItems = navItems.filter(item => !item.requiresStaff || isStaff);

  return (
    <nav className="sticky top-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="space-y-1 p-2">
        {/* Admin/Staff Dashboard Link */}
        {isStaff && (
          <>
            <a
              href="/admin/dashboard"
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Shield 
                className="w-5 h-5 mt-0.5 transition-colors text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  Dashboard
                </div>
                <div className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                  {["OWNER", "ADMIN"].includes(userRole) ? "Admin panel" : "Staff panel"}
                </div>
              </div>
            </a>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
          </>
        )}

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mt-0.5 transition-colors",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                )} 
              />
              <div className="flex-1 min-w-0 text-left">
                <div className={cn(
                  "text-sm font-medium",
                  isActive
                    ? "text-blue-900 dark:text-blue-100"
                    : "text-slate-900 dark:text-white"
                )}>
                  {item.title}
                </div>
                <div className={cn(
                  "text-xs mt-0.5",
                  isActive
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-slate-500 dark:text-slate-400"
                )}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-2">
        <SignOutButton />
      </div>
    </nav>
  );
}

