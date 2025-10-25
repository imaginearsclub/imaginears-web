"use client";

import { useState, useRef, useEffect } from "react";
import { Input, Alert, Spinner, Button } from "@/components/common";
import { cn } from "@/lib/utils";
import { Shield, ArrowLeft } from "lucide-react";

interface TwoFactorVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
}

export function TwoFactorVerification({
  email,
  onVerify,
  onBack,
  loading,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (!useBackupCode) {
      inputRefs.current[0]?.focus();
    }
  }, [useBackupCode]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && digit) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      setError(null);
      inputRefs.current[5]?.focus();
      
      // Auto-submit pasted code
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (codeToSubmit?: string) => {
    const finalCode = codeToSubmit || (useBackupCode ? backupCode : code.join(""));
    
    if (!finalCode || (useBackupCode && finalCode.length < 8) || (!useBackupCode && finalCode.length !== 6)) {
      setError(useBackupCode ? "Please enter a valid backup code" : "Please enter the complete 6-digit code");
      return;
    }

    setError(null);
    const success = await onVerify(finalCode);
    
    if (!success) {
      setError(useBackupCode 
        ? "Invalid backup code. Please try again or use your authenticator app." 
        : "Invalid code. Please try again.");
      
      if (!useBackupCode) {
        // Clear code inputs on error
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-lg",
          "bg-blue-100 dark:bg-blue-900/30"
        )}>
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {useBackupCode ? "Enter backup code" : "Enter code from your authenticator app"}
          </p>
        </div>
      </div>

      {/* Email display */}
      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Signing in as:{" "}
          <span className="font-medium text-slate-900 dark:text-white">{email}</span>
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Code Input */}
      {!useBackupCode ? (
        <div className="space-y-4">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-mono"
                autoComplete="off"
              />
            ))}
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Open your authenticator app to view your authentication code
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
              Backup Code
            </label>
            <Input
              type="text"
              value={backupCode}
              onChange={(e) => {
                setBackupCode(e.target.value.toUpperCase());
                setError(null);
              }}
              disabled={loading}
              placeholder="XXXX-XXXX"
              className="text-center text-lg font-mono tracking-wider"
              autoComplete="off"
              autoFocus
            />
          </div>

          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Enter one of your 8-character backup codes
          </p>

          <Button
            onClick={() => handleSubmit()}
            disabled={loading || backupCode.length < 8}
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner size="sm" variant="current" />
                Verifying...
              </>
            ) : (
              "Verify Backup Code"
            )}
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setError(null);
            setCode(["", "", "", "", "", ""]);
            setBackupCode("");
          }}
          disabled={loading}
          className={cn(
            "w-full text-sm text-blue-600 dark:text-blue-400 hover:underline",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {useBackupCode ? "Use authenticator app instead" : "Use backup code instead"}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            "bg-slate-100 dark:bg-slate-800",
            "text-slate-700 dark:text-slate-300",
            "hover:bg-slate-200 dark:hover:bg-slate-700",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>

      {/* Security note */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Security Tip:</strong> Never share your authentication codes with anyone.
          Our staff will never ask for your 2FA code.
        </p>
      </div>
    </div>
  );
}

