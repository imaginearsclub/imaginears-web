"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Badge } from "@/components/common";
import { AlertCircle, CheckCircle, Loader2, Mail, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    role: string;
    emailVerified: boolean | null;
  };
  action: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

const ROLE_DISPLAY = {
  OWNER: { label: "Owner", color: "destructive" },
  ADMIN: { label: "Admin", color: "primary" },
  MODERATOR: { label: "Moderator", color: "secondary" },
  STAFF: { label: "Staff", color: "default" },
  USER: { label: "Guest", color: "default" },
} as const;

export function ProfileForm({ user, action }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await action(formData);
        setResult(res);
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to update profile",
        });
      }
    });
  };

  const roleInfo = ROLE_DISPLAY[user.role as keyof typeof ROLE_DISPLAY] || ROLE_DISPLAY.USER;

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" required>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </div>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name}
            placeholder="John Doe"
            required
            disabled={isPending}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" required>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </div>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user.email}
            placeholder="john.doe@imaginears.club"
            required
            disabled={isPending}
          />
          {user.emailVerified ? (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Email verified
            </p>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Email not verified
            </p>
          )}
        </div>
      </div>

      {/* Role (Read-only) */}
      <div className="space-y-2">
        <Label>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Account Role
          </div>
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant={roleInfo.color as any} size="md">
            {roleInfo.label}
          </Badge>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            (Contact an administrator to change your role)
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

