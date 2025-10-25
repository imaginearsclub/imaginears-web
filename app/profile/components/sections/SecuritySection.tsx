"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { Key, Shield } from "lucide-react";
import { PasswordChangeForm } from "@/app/profile/components/PasswordChangeForm";
import { TwoFactorSetup } from "@/app/profile/components/TwoFactorSetup";
import { EnhancedSessionsList } from "@/app/profile/components/EnhancedSessionsList";
import { DeviceFingerprint } from "@/app/profile/components/DeviceFingerprint";
import { SessionRiskDashboard } from "@/app/profile/components/SessionRiskDashboard";
import { RealtimeSessionMonitor } from "@/app/profile/components/RealtimeSessionMonitor";
import { SessionConflictDetector } from "@/app/profile/components/SessionConflictDetector";
import { SessionExportTools } from "@/app/profile/components/SessionExportTools";
import {
  changePasswordAction,
  enable2FAAction,
  disable2FAAction,
  verify2FASetupAction,
} from "@/app/profile/actions";

interface SecuritySectionProps {
  hasPasswordAuth: boolean;
  twoFactorEnabled: boolean;
  sessions: Array<{
    id: string;
    token: string;
    deviceName: string | null;
    deviceType: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    city: string | null;
    trustLevel: number;
    isSuspicious: boolean;
    lastActivityAt: Date;
    isRememberMe: boolean;
    loginMethod: string | null;
    createdAt: Date;
    expiresAt: Date;
  }>;
  currentSessionToken: string | undefined;
}

export function SecuritySection({ 
  hasPasswordAuth, 
  twoFactorEnabled, 
  sessions,
  currentSessionToken 
}: SecuritySectionProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Security Settings
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your password, two-factor authentication, and active sessions
        </p>
      </div>

      {/* Security Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Risk Dashboard */}
        <SessionRiskDashboard />

        {/* Real-time Monitor */}
        <RealtimeSessionMonitor />
      </div>

      {/* Session Conflict Detection */}
      <SessionConflictDetector />

      {/* Password Change */}
      {hasPasswordAuth && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <CardTitle className="text-base">Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <PasswordChangeForm action={changePasswordAction} />
          </CardContent>
        </Card>
      )}

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup
            isEnabled={twoFactorEnabled}
            enableAction={enable2FAAction}
            disableAction={disable2FAAction}
            verifyAction={verify2FASetupAction}
          />
        </CardContent>
      </Card>

      {/* Device Fingerprint */}
      <DeviceFingerprint />

      {/* Active Sessions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <CardTitle className="text-base">Active Sessions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <EnhancedSessionsList 
            sessions={sessions}
            currentSessionToken={currentSessionToken}
          />
        </CardContent>
      </Card>

      {/* Export Tools */}
      <SessionExportTools />
    </div>
  );
}

