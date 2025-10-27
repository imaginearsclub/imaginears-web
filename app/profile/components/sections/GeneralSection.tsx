"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { User, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileForm } from "@/app/profile/components/ProfileForm";
import { TimezoneSelector } from "@/app/profile/components/TimezoneSelector";
import { updateProfileAction, updateTimezoneAction } from "@/app/profile/actions";

interface GeneralSectionProps {
  user: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean | null;
    timezone: string | null;
    createdAt: Date;
    image?: string | null;
  };
}

export function GeneralSection({ user }: GeneralSectionProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          General Settings
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your profile information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <CardTitle className="text-base">Profile Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm 
            user={{
              name: user.name,
              email: user.email,
              role: user.role,
              emailVerified: user.emailVerified,
            }} 
            action={updateProfileAction} 
          />
        </CardContent>
      </Card>

      {/* Timezone Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <CardTitle className="text-base">Timezone Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TimezoneSelector
            currentTimezone={user.timezone}
            action={updateTimezoneAction}
          />
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <CardTitle className="text-base">Account Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">Account Role</span>
            <span className="text-sm font-semibold capitalize">{user.role.toLowerCase()}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">Email Status</span>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              user.emailVerified 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            )}>
              {user.emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Member Since</span>
            <span className="text-sm font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

