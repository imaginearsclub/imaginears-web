"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/common";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateStaffFormProps {
  action: (formData: FormData) => Promise<{ success: boolean; message: string; userId?: string }>;
}

const ROLES = [
  { value: "STAFF", label: "Staff", description: "Basic staff member with limited permissions" },
  { value: "MODERATOR", label: "Moderator", description: "Can manage players and moderate content" },
  { value: "ADMIN", label: "Admin", description: "Full administrative access" },
  { value: "OWNER", label: "Owner", description: "Complete system control" },
] as const;

export function CreateStaffForm({ action }: CreateStaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [minecraftName, setMinecraftName] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await action(formData);
        setResult(res);
        
        if (res.success) {
          // Reset form
          e.currentTarget.reset();
          setPassword("");
          setMinecraftName("");
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to create staff member",
        });
      }
    });
  };

  const generatePassword = () => {
    // Generate a secure random password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const passwordStrength = password.length >= 12 ? "strong" : password.length >= 8 ? "medium" : "weak";

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
            Full Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            disabled={isPending}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john.doe@imaginears.club"
            required
            disabled={isPending}
          />
        </div>

        {/* Minecraft Username */}
        <div className="space-y-2">
          <Label htmlFor="minecraftName">
            Minecraft Username
          </Label>
          <Input
            id="minecraftName"
            name="minecraftName"
            type="text"
            placeholder="Steve123"
            value={minecraftName}
            onChange={(e) => setMinecraftName(e.target.value)}
            disabled={isPending}
            pattern="[a-zA-Z0-9_]{3,16}"
            title="3-16 characters, alphanumeric and underscores only"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            3-16 characters, alphanumeric and underscores only
          </p>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role" required>
            Role
          </Label>
          <select
            id="role"
            name="role"
            required
            disabled={isPending}
            className={cn(
              "w-full rounded-xl border-2 px-4 py-2.5 outline-none transition-all duration-200",
              "bg-white dark:bg-slate-900",
              "border-slate-300 dark:border-slate-700",
              "text-slate-700 dark:text-slate-300",
              "hover:border-slate-400 dark:hover:border-slate-600",
              "focus:ring-2 focus:ring-blue-500/50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" required>
          Initial Password
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isPending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={generatePassword}
            disabled={isPending}
          >
            Generate
          </Button>
        </div>
        {password && (
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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The staff member will use this password to log in. Make sure to securely share it with them.
        </p>
      </div>

      {/* Role Descriptions */}
      <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
        <h4 className="font-semibold text-sm mb-3 text-slate-900 dark:text-white">Role Permissions:</h4>
        <div className="space-y-2">
          {ROLES.map((role) => (
            <div key={role.value} className="text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">{role.label}:</span>{" "}
              <span className="text-slate-600 dark:text-slate-400">{role.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Cast Member"
          )}
        </Button>
      </div>
    </form>
  );
}

