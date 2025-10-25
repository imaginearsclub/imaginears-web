"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/common";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordChangeFormProps {
  action: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

export function PasswordChangeForm({ action }: PasswordChangeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await action(formData);
        setResult(res);
        
        if (res.success) {
          // Reset form on success
          e.currentTarget.reset();
          setNewPassword("");
          setConfirmPassword("");
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to change password",
        });
      }
    });
  };

  const passwordStrength = newPassword.length >= 12 ? "strong" : newPassword.length >= 8 ? "medium" : "weak";
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword" required>
          Current Password
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            name="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter your current password"
            required
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            tabIndex={-1}
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword" required>
          New Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            tabIndex={-1}
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {newPassword && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  passwordStrength === "strong" && "w-full bg-green-500",
                  passwordStrength === "medium" && "w-2/3 bg-yellow-500",
                  passwordStrength === "weak" && "w-1/3 bg-red-500"
                )}
              />
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
              {passwordStrength}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" required>
          Confirm New Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={isPending}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword && (
          <p className={cn(
            "text-xs flex items-center gap-1",
            passwordsMatch 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          )}>
            {passwordsMatch ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Passwords match
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Passwords do not match
              </>
            )}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !passwordsMatch} size="lg">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changing Password...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </div>
    </form>
  );
}

