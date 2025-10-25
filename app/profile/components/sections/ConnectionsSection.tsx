"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { Gamepad2, Key } from "lucide-react";
import { MinecraftLinkForm } from "@/app/profile/components/MinecraftLinkForm";
import { ConnectedAccounts } from "@/app/profile/components/ConnectedAccounts";
import {
  updateMinecraftAction,
  linkDiscordAction,
  unlinkAccountAction,
} from "@/app/profile/actions";

interface ConnectionsSectionProps {
  minecraftName: string | null;
  minecraftPermissions: any;
  accounts: Array<{
    id: string;
    providerId: string;
    accountId: string;
    createdAt: Date;
  }>;
}

export function ConnectionsSection({ 
  minecraftName, 
  minecraftPermissions, 
  accounts 
}: ConnectionsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Connected Accounts
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Link your Minecraft account and manage connected services
        </p>
      </div>

      {/* Minecraft Account */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            <CardTitle className="text-base">Minecraft Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MinecraftLinkForm 
            currentUsername={minecraftName}
            permissions={minecraftPermissions}
            action={updateMinecraftAction}
          />
        </CardContent>
      </Card>

      {/* Social Accounts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            <CardTitle className="text-base">Social & Login Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ConnectedAccounts
            accounts={accounts}
            linkDiscordAction={linkDiscordAction}
            unlinkAction={unlinkAccountAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}

