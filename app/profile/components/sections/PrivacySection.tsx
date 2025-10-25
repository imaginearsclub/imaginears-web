"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { Lock } from "lucide-react";
import { GDPRDataManagement } from "@/app/profile/components/GDPRDataManagement";

interface PrivacySectionProps {
  hasPassword: boolean;
}

export function PrivacySection({ hasPassword }: PrivacySectionProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Privacy & Data Management
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Control your personal data and privacy settings
        </p>
      </div>

      {/* GDPR Data Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <CardTitle className="text-base">Your Data & Privacy Rights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <GDPRDataManagement hasPassword={hasPassword} />
        </CardContent>
      </Card>
    </div>
  );
}

