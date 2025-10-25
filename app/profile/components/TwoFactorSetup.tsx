"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Badge } from "@/components/common";
import { AlertCircle, CheckCircle, Loader2, Shield, Copy, Eye, EyeOff, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TwoFactorSetupProps {
  isEnabled: boolean;
  enableAction: (formData: FormData) => Promise<{
    success: boolean;
    message: string;
    qrCode?: string;
    secret?: string;
    backupCodes?: string[];
  }>;
  disableAction: (formData: FormData) => Promise<{
    success: boolean;
    message: string;
  }>;
  verifyAction: (formData: FormData) => Promise<{
    success: boolean;
    message: string;
    backupCodes?: string[];
  }>;
}

export function TwoFactorSetup({
  isEnabled,
  enableAction,
  disableAction,
  verifyAction,
}: TwoFactorSetupProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [setupData, setSetupData] = useState<{
    qrCode: string;
    secret: string;
  } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Handle enable 2FA (generate QR)
  const handleEnable = () => {
    setResult(null);
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        const res = await enableAction(formData);
        setResult(res);
        
        if (res.success && res.qrCode && res.secret) {
          setSetupData({
            qrCode: res.qrCode,
            secret: res.secret,
          });
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to initialize 2FA setup",
        });
      }
    });
  };

  // Handle verify setup (confirm with code)
  const handleVerifySetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const res = await verifyAction(formData);
        setResult(res);
        
        if (res.success && res.backupCodes) {
          setBackupCodes(res.backupCodes);
          setShowBackupCodes(true);
          setSetupData(null); // Clear setup data
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to verify 2FA code",
        });
      }
    });
  };

  // Handle disable 2FA
  const handleDisable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const res = await disableAction(formData);
        setResult(res);
        
        if (res.success) {
          setBackupCodes([]);
          setShowBackupCodes(false);
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to disable 2FA",
        });
      }
    });
  };

  // Copy secret to clipboard
  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    if (backupCodes.length > 0) {
      navigator.clipboard.writeText(backupCodes.join("\n"));
    }
  };

  // Download backup codes as text file
  const downloadBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const content = `Imaginears Club - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Save these codes in a secure location.
Each code can only be used once.

${backupCodes.join("\n")}

Keep these codes safe! If you lose access to your authenticator app,
you can use these codes to regain access to your account.
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imaginears-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Result Message */}
      {result && !showBackupCodes && (
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

      {/* Backup Codes Display (after successful setup) */}
      {showBackupCodes && backupCodes.length > 0 && (
        <div className="p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Save Your Backup Codes
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                Each code can only be used once. Store them in a secure location like a password manager.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700">
            {backupCodes.map((code, index) => (
              <code key={index} className="text-sm font-mono p-2 bg-slate-50 dark:bg-slate-900 rounded">
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyBackupCodes}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadBackupCodes}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Once you close this page, you won't be able to see these codes again!
          </p>
        </div>
      )}

      {/* Setup Flow: QR Code & Verification */}
      {setupData && !showBackupCodes && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Step 1: Scan QR Code
            </h4>
            
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                <Image
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
              
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                Scan this code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </p>

              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm text-blue-900 dark:text-blue-100">
                    Or enter this key manually:
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 text-sm font-mono break-all">
                    {showSecret ? setupData.secret : "••••••••••••••••"}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleVerifySetup} className="space-y-4">
            {/* Hidden field to pass secret to server action */}
            <input type="hidden" name="secret" value={setupData.secret} />
            
            <div className="p-6 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-4">
                Step 2: Verify Setup
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="verificationCode">
                  Enter the 6-digit code from your authenticator app
                </Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(value);
                  }}
                  disabled={isPending}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSetupData(null);
                  setResult(null);
                  setVerificationCode("");
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || verificationCode.length !== 6}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Current Status */}
      {!setupData && !showBackupCodes && (
        <div>
          {isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Two-Factor Authentication Enabled
                      </p>
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your account is protected with 2FA
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleDisable} className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                <h4 className="font-semibold text-sm">Disable Two-Factor Authentication</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your password and a current 2FA code to disable two-factor authentication.
                </p>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="disablePassword">Password</Label>
                    <Input
                      id="disablePassword"
                      name="password"
                      type="password"
                      required
                      disabled={isPending}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="disable2FACode">2FA Code</Label>
                    <Input
                      id="disable2FACode"
                      name="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      disabled={isPending}
                      className="text-center text-xl tracking-widest font-mono"
                    />
                  </div>
                </div>

                <Button type="submit" variant="danger" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    "Disable 2FA"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Shield className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Two-Factor Authentication Disabled
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                  Why enable 2FA?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Protect your account from unauthorized access</li>
                  <li>• Required for admin and staff accounts</li>
                  <li>• Use any TOTP authenticator app</li>
                  <li>• Get backup codes for recovery</li>
                </ul>
              </div>

              <Button onClick={handleEnable} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Enable Two-Factor Authentication
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

