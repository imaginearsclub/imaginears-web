"use client";

import { useState, useTransition } from "react";
import { Button, Input, Alert } from "@/components/common";
import { User, Mail, Gamepad2, Shield, Key, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateStaffFormProps {
  action: (formData: FormData) => Promise<{ success: boolean; message?: string; userId?: string | undefined }>;
}

const ROLES = [
  { value: "STAFF", label: "Staff", description: "Basic staff member with limited permissions" },
  { value: "MODERATOR", label: "Moderator", description: "Can manage players and moderate content" },
  { value: "ADMIN", label: "Admin", description: "Full administrative access" },
  { value: "OWNER", label: "Owner", description: "Complete system control" },
] as const;

export function CreateStaffForm({ action }: CreateStaffFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);
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
        <Alert 
          variant={result.success ? "success" : "error"}
          dismissible
          onDismiss={() => setResult(null)}
        >
          {result.message}
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <Input
          id="name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="John Doe"
          leftIcon={<User />}
          required
          disabled={isPending}
          helperText="Staff member's legal or display name"
        />

        {/* Email */}
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="john.doe@imaginears.club"
          leftIcon={<Mail />}
          required
          disabled={isPending}
          helperText="Used for login and notifications"
        />

        {/* Minecraft Username */}
        <Input
          id="minecraftName"
          name="minecraftName"
          type="text"
          label="Minecraft Username"
          placeholder="Steve123"
          leftIcon={<Gamepad2 />}
          value={minecraftName}
          onChange={(e) => setMinecraftName(e.target.value)}
          disabled={isPending}
          pattern="[a-zA-Z0-9_]{3,16}"
          helperText="3-16 characters, alphanumeric and underscores only"
        />

        {/* Role */}
        <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Role <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <select
              id="role"
              name="role"
              required
              disabled={isPending}
              className={cn(
                "w-full rounded-xl border-2 pl-10 pr-4 py-2.5 outline-none transition-all duration-200",
                "bg-white dark:bg-slate-900",
                "border-slate-300 dark:border-slate-700",
                "text-slate-700 dark:text-slate-300",
                "hover:border-slate-400 dark:hover:border-slate-600",
                "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Determines permissions and access level
          </p>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-3">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Initial Password <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex gap-2">
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            leftIcon={<Key />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isPending}
            containerClassName="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={generatePassword}
            disabled={isPending}
            ariaLabel="Generate secure random password"
          >
            Generate
          </Button>
        </div>
        {password && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  passwordStrength === "strong" && "w-full bg-green-500",
                  passwordStrength === "medium" && "w-2/3 bg-amber-500",
                  passwordStrength === "weak" && "w-1/3 bg-red-500"
                )}
              />
            </div>
            <span className={cn(
              "text-xs font-medium capitalize",
              passwordStrength === "strong" && "text-green-600 dark:text-green-400",
              passwordStrength === "medium" && "text-amber-600 dark:text-amber-400",
              passwordStrength === "weak" && "text-red-600 dark:text-red-400"
            )}>
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
        <Button 
          type="submit" 
          variant="primary"
          size="lg"
          isLoading={isPending}
          loadingText="Creating Staff Member..."
          leftIcon={<UserPlus />}
          ariaLabel="Create new staff member"
        >
          Create Staff Member
        </Button>
      </div>
    </form>
  );
}

