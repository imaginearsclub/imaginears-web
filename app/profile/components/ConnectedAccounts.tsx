"use client";

import { useState, useTransition } from "react";
import { Button, Badge } from "@/components/common";
import { AlertCircle, CheckCircle, Loader2, Link as LinkIcon, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: Date;
}

interface ConnectedAccountsProps {
  accounts: Account[];
  linkDiscordAction: (formData: FormData) => Promise<{ success: boolean; message: string; url?: string }>;
  unlinkAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

export function ConnectedAccounts({
  accounts,
  linkDiscordAction,
  unlinkAction,
}: ConnectedAccountsProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Check which providers are connected
  const hasCredentials = accounts.some(a => a.providerId === "credential");
  const discordAccount = accounts.find(a => a.providerId === "discord");

  const handleLinkDiscord = () => {
    setResult(null);
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        const res = await linkDiscordAction(formData);
        
        if (res.success && res.url) {
          // Redirect to Discord OAuth
          window.location.href = res.url;
        } else {
          setResult(res);
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to initiate Discord linking",
        });
      }
    });
  };

  const handleUnlink = (providerId: string) => {
    if (!confirm(`Are you sure you want to unlink your ${providerId} account?`)) {
      return;
    }

    setResult(null);
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("providerId", providerId);
        const res = await unlinkAction(formData);
        setResult(res);
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to unlink account",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Result Message */}
      {result && (
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border-2",
            result.success
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          )}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}
          <p
            className={cn(
              "text-sm font-medium",
              result.success
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            )}
          >
            {result.message}
          </p>
        </div>
      )}

      {/* Connected Accounts List */}
      <div className="space-y-3">
        {/* Email/Password Account */}
        {hasCredentials && (
          <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800">
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Email & Password
                  </p>
                  <Badge variant="default" size="sm">
                    Primary
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sign in with your email and password
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Discord Account */}
        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#5865F2]/10 dark:bg-[#5865F2]/20">
              <svg className="w-5 h-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Discord
                </p>
                {discordAccount ? (
                  <Badge variant="success" size="sm">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    Not Connected
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {discordAccount 
                  ? `Connected on ${new Date(discordAccount.createdAt).toLocaleDateString()}`
                  : "Sign in faster with your Discord account"
                }
              </p>
            </div>
          </div>
          
          <div>
            {discordAccount ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleUnlink("discord")}
                disabled={isPending || !hasCredentials}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Unlinking...
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4 mr-1" />
                    Unlink
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleLinkDiscord}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-1" />
                    Link Discord
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      {!hasCredentials && discordAccount && (
        <div className="p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>⚠️ Warning:</strong> You cannot unlink Discord because it's your only login method. 
            Set up an email & password first.
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
          Why connect multiple accounts?
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Sign in faster with Discord OAuth</li>
          <li>• Keep your account accessible if you lose access to one method</li>
          <li>• Your data stays synced across all login methods</li>
          <li>• 2FA protection applies to all connected accounts</li>
        </ul>
      </div>
    </div>
  );
}

