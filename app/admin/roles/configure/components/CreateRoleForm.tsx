"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common";
import { Spinner } from "@/components/common/Spinner";
import { Alert } from "@/components/common/Alert";
import { Checkbox } from "@/components/common/Checkbox";
import { type Permission } from "@/lib/rbac";

interface CreateRoleFormProps {
  action: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

const PERMISSION_CATEGORIES = {
  Events: ["events:read", "events:write", "events:delete", "events:publish"],
  Applications: ["applications:read", "applications:write", "applications:delete", "applications:approve"],
  Players: ["players:read", "players:write", "players:ban"],
  Users: ["users:read", "users:write", "users:delete", "users:manage_roles"],
  "Bulk Operations": [
    "users:bulk_operations",
    "users:bulk_suspend",
    "users:bulk_activate",
    "users:bulk_change_roles",
    "users:bulk_reset_passwords",
    "users:bulk_send_email",
  ],
  "Session Management": [
    "sessions:view_own",
    "sessions:view_all",
    "sessions:view_analytics",
    "sessions:revoke_own",
    "sessions:revoke_any",
    "sessions:configure_policies",
    "sessions:view_health",
  ],
  Settings: ["settings:read", "settings:write", "settings:security"],
  Dashboard: ["dashboard:view", "dashboard:stats"],
  System: ["system:maintenance", "system:logs"],
};

export function CreateRoleForm({ action }: CreateRoleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set("permissions", JSON.stringify(Array.from(selectedPermissions)));

    startTransition(async () => {
      try {
        const res = await action(formData);
        setResult(res);
        
        if (res.success) {
          // Reset form
          e.currentTarget.reset();
          setSelectedPermissions(new Set());
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to create role",
        });
      }
    });
  };

  const togglePermission = (permission: Permission) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permission)) {
      newSet.delete(permission);
    } else {
      newSet.add(permission);
    }
    setSelectedPermissions(newSet);
  };

  const toggleCategory = (category: Permission[]) => {
    const allSelected = category.every(p => selectedPermissions.has(p));
    const newSet = new Set(selectedPermissions);
    
    if (allSelected) {
      category.forEach(p => newSet.delete(p));
    } else {
      category.forEach(p => newSet.add(p));
    }
    
    setSelectedPermissions(newSet);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && (
        <Alert variant={result.success ? "success" : "error"}>
          {result.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Role Name *
          </label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Event Manager"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">
            Role Slug * <span className="text-xs text-slate-500">(lowercase, hyphens, underscores)</span>
          </label>
          <Input
            id="slug"
            name="slug"
            placeholder="e.g., event-manager"
            pattern="[a-z0-9-_]+"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description
        </label>
        <Input
          id="description"
          name="description"
          placeholder="Brief description of this role"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium mb-2">
          Badge Color <span className="text-xs text-slate-500">(hex color, e.g., #3B82F6)</span>
        </label>
        <Input
          id="color"
          name="color"
          placeholder="#3B82F6"
          pattern="^#[0-9A-Fa-f]{6}$"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">
          Permissions ({selectedPermissions.size} selected)
        </label>
        <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg max-h-[400px] overflow-y-auto">
          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
            const categoryPerms = permissions as Permission[];
            const allSelected = categoryPerms.every(p => selectedPermissions.has(p));
            const someSelected = categoryPerms.some(p => selectedPermissions.has(p));

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={allSelected ? true : (someSelected && !allSelected) ? "indeterminate" : false}
                    onCheckedChange={() => toggleCategory(categoryPerms)}
                    disabled={isPending}
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="font-semibold text-sm cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
                <div className="ml-6 space-y-1.5">
                  {categoryPerms.map((permission) => (
                    <div key={permission} className="flex items-center gap-2">
                      <Checkbox
                        id={permission}
                        checked={selectedPermissions.has(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                        disabled={isPending}
                      />
                      <label
                        htmlFor={permission}
                        className="text-sm cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        {permission.split(':')[1]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelectedPermissions(new Set());
            setResult(null);
          }}
          disabled={isPending}
        >
          Clear
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Spinner className="mr-2" />
              Creating...
            </>
          ) : (
            "Create Role"
          )}
        </Button>
      </div>
    </form>
  );
}

