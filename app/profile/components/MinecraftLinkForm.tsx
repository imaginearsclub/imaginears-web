"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Badge } from "@/components/common";
import { AlertCircle, CheckCircle, Loader2, Gamepad2, Link, Unlink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinecraftLinkFormProps {
  currentUsername: string | null;
  permissions: {
    success: boolean;
    uuid?: string;
    primaryGroup?: string;
    groups?: string[];
    permissions?: Array<{ permission: string; value: boolean; server: string; world: string }>;
    error?: string;
  } | null;
  action: (formData: FormData) => Promise<{ success: boolean; message: string; uuid?: string }>;
}

export function MinecraftLinkForm({ currentUsername, permissions, action }: MinecraftLinkFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isEditing, setIsEditing] = useState(!currentUsername);
  const [minecraftName, setMinecraftName] = useState(currentUsername || "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await action(formData);
        setResult(res);
        
        if (res.success) {
          setIsEditing(false);
          if (!minecraftName) {
            // If unlinking, clear the input
            setMinecraftName("");
          }
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to update Minecraft username",
        });
      }
    });
  };

  const handleUnlink = () => {
    setMinecraftName("");
    setIsEditing(true);
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

      {/* Current Status */}
      {currentUsername && !isEditing ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Gamepad2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {currentUsername}
                  </p>
                  <Badge variant="success" size="sm">
                    Linked
                  </Badge>
                </div>
                {permissions?.uuid && (
                  <p className="text-sm text-green-700 dark:text-green-300">
                    UUID: <span className="font-mono text-xs">{permissions.uuid}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleUnlink}
              >
                <Unlink className="w-4 h-4 mr-1" />
                Unlink
              </Button>
            </div>
          </div>

          {/* Permissions Display */}
          {permissions?.groups && permissions.groups.length > 0 && (
            <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Your Permission Groups
              </h4>
              <div className="flex flex-wrap gap-2">
                {permissions.groups.map((group) => (
                  <Badge key={group} variant="default" size="sm">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minecraftName">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Minecraft Username
              </div>
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
              Enter your Minecraft username as it appears in-game. We'll verify it against our server database.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            {currentUsername && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setMinecraftName(currentUsername);
                  setResult(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {minecraftName ? "Linking..." : "Unlinking..."}
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  {minecraftName ? "Link Account" : "Unlink Account"}
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
          Why link your Minecraft account?
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Access staff features in-game</li>
          <li>• Sync permissions with LuckPerms</li>
          <li>• Verify your identity for event management</li>
          <li>• Get credit for your in-game contributions</li>
        </ul>
      </div>
    </div>
  );
}

