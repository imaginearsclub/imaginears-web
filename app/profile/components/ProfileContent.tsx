"use client";

import { useState } from "react";
import { ProfileNav, type ProfileSection } from "./ProfileNav";
import { GeneralSection } from "./sections/GeneralSection";
import { SecuritySection } from "./sections/SecuritySection";
import { ConnectionsSection } from "./sections/ConnectionsSection";
import { ApplicationsSection } from "./sections/ApplicationsSection";
import { ApiKeysSection } from "./sections/ApiKeysSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { PrivacySection } from "./sections/PrivacySection";

interface ProfileContentProps {
  userData: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean | null;
    timezone: string | null;
    createdAt: Date;
    minecraftName: string | null;
    twoFactorEnabled: boolean;
  };
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
  accounts: Array<{
    id: string;
    providerId: string;
    accountId: string;
    createdAt: Date;
  }>;
  applications: Array<{
    id: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    mcUsername: string;
    role: string;
    ageRange: string;
    notes: string | null;
    updatedBy: { name: string | null } | null;
    priorServers: string | null;
    visitedDetails: string | null;
    devPortfolioUrl: string | null;
    imgPortfolioUrl: string | null;
    grStory: string | null;
  }>;
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    isActive: boolean;
    rateLimit: number;
    lastUsedAt: Date | null;
    usageCount: number;
    description: string | null;
    expiresAt: Date | null;
    createdAt: Date;
  }>;
  minecraftPermissions: any;
  currentSessionToken?: string;
}

export function ProfileContent({
  userData,
  sessions,
  accounts,
  applications,
  apiKeys,
  minecraftPermissions,
  currentSessionToken,
}: ProfileContentProps) {
  const [activeSection, setActiveSection] = useState<ProfileSection>("general");

  const hasPasswordAuth = accounts.some(a => a.providerId === "credential");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar Navigation */}
      <aside className="lg:col-span-3">
        <ProfileNav 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          userRole={userData.role}
        />
      </aside>

      {/* Main Content with smooth transition */}
      <div className="lg:col-span-9">
        <div className="transition-opacity duration-200">
          {activeSection === "general" && (
            <GeneralSection user={userData} />
          )}
          {activeSection === "security" && (
            <SecuritySection
              hasPasswordAuth={hasPasswordAuth}
              twoFactorEnabled={userData.twoFactorEnabled}
              sessions={sessions}
              currentSessionToken={currentSessionToken}
            />
          )}
          {activeSection === "connections" && (
            <ConnectionsSection
              minecraftName={userData.minecraftName}
              minecraftPermissions={minecraftPermissions}
              accounts={accounts}
            />
          )}
          {activeSection === "applications" && (
            <ApplicationsSection applications={applications} />
          )}
          {activeSection === "api-keys" && (
            <ApiKeysSection apiKeys={apiKeys} />
          )}
          {activeSection === "notifications" && (
            <NotificationsSection />
          )}
          {activeSection === "privacy" && (
            <PrivacySection hasPassword={hasPasswordAuth} />
          )}
        </div>
      </div>
    </div>
  );
}

