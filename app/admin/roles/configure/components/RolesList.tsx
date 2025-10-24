"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/common/Dialog";
import { Input } from "@/components/common/Input";
import { Checkbox } from "@/components/common/Checkbox";
import { Alert } from "@/components/common/Alert";
import { Spinner } from "@/components/common/Spinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Permission } from "@/lib/rbac";
import { Pencil, Trash2, Shield } from "lucide-react";

interface Role {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  isSystem: boolean;
  color: string | null;
  userCount: number;
  createdAt: Date;
}

interface RolesListProps {
  roles: Role[];
  updateAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

const PERMISSION_CATEGORIES = {
  Events: ["events:read", "events:write", "events:delete", "events:publish"],
  Applications: ["applications:read", "applications:write", "applications:delete", "applications:approve"],
  Players: ["players:read", "players:write", "players:ban"],
  Users: ["users:read", "users:write", "users:delete", "users:manage_roles"],
  Settings: ["settings:read", "settings:write", "settings:security"],
  Dashboard: ["dashboard:view", "dashboard:stats"],
  System: ["system:maintenance", "system:logs"],
};

export function RolesList({ roles, updateAction, deleteAction }: RolesListProps) {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set());

  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(new Set(role.permissions));
    setResult(null);
  };

  const closeEditDialog = () => {
    setEditingRole(null);
    setSelectedPermissions(new Set());
    setResult(null);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRole) return;

    setResult(null);
    const formData = new FormData(e.currentTarget);
    formData.set("roleId", editingRole.id);
    formData.set("permissions", JSON.stringify(Array.from(selectedPermissions)));

    startTransition(async () => {
      try {
        const res = await updateAction(formData);
        setResult(res);
        
        if (res.success) {
          setTimeout(() => closeEditDialog(), 1500);
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to update role",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!deletingRole) return;

    const formData = new FormData();
    formData.set("roleId", deletingRole.id);

    startTransition(async () => {
      try {
        const res = await deleteAction(formData);
        
        if (res.success) {
          setDeletingRole(null);
        } else {
          alert(res.message);
        }
      } catch (error: any) {
        alert(error.message || "Failed to delete role");
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
    <>
      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-lg">{role.name}</h3>
                {role.isSystem && (
                  <Badge variant="default" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    System
                  </Badge>
                )}
                {role.color && (
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700"
                    style={{ backgroundColor: role.color }}
                  />
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {role.description || "No description"}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Slug: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{role.slug}</code></span>
                <span>{role.permissions.length} permissions</span>
                <span>{role.userCount} {role.userCount === 1 ? "user" : "users"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEditDialog(role)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              {!role.isSystem && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setDeletingRole(role)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
            <DialogDescription>
              Modify role details and permissions. {editingRole?.isSystem ? "System roles cannot be deleted but permissions can be customized." : ""}
            </DialogDescription>
          </DialogHeader>

          {editingRole && (
            <form onSubmit={handleUpdate} className="space-y-6 mt-4">
              {result && (
                <Alert variant={result.success ? "success" : "error"}>
                  {result.message}
                </Alert>
              )}

              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium mb-2">
                  Role Name *
                </label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingRole.name}
                  required
                  disabled={isPending}
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editingRole.description || ""}
                  disabled={isPending}
                />
              </div>

              <div>
                <label htmlFor="edit-color" className="block text-sm font-medium mb-2">
                  Badge Color <span className="text-xs text-slate-500">(hex color)</span>
                </label>
                <Input
                  id="edit-color"
                  name="color"
                  defaultValue={editingRole.color || ""}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder="#3B82F6"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Permissions ({selectedPermissions.size} selected)
                </label>
                <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-800 rounded-lg max-h-[300px] overflow-y-auto">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
                    const categoryPerms = permissions as Permission[];
                    const allSelected = categoryPerms.every(p => selectedPermissions.has(p));
                    const someSelected = categoryPerms.some(p => selectedPermissions.has(p));

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox
                            id={`edit-category-${category}`}
                            checked={allSelected ? true : (someSelected && !allSelected) ? "indeterminate" : false}
                            onCheckedChange={() => toggleCategory(categoryPerms)}
                            disabled={isPending}
                          />
                          <label
                            htmlFor={`edit-category-${category}`}
                            className="font-semibold text-sm cursor-pointer"
                          >
                            {category}
                          </label>
                        </div>
                        <div className="ml-6 space-y-1.5">
                          {categoryPerms.map((permission) => (
                            <div key={permission} className="flex items-center gap-2">
                              <Checkbox
                                id={`edit-${permission}`}
                                checked={selectedPermissions.has(permission)}
                                onCheckedChange={() => togglePermission(permission)}
                                disabled={isPending}
                              />
                              <label
                                htmlFor={`edit-${permission}`}
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
                  onClick={closeEditDialog}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Spinner className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Role"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        description={
          deletingRole
            ? `Are you sure you want to delete the role "${deletingRole.name}"? This action cannot be undone.${
                deletingRole.userCount > 0
                  ? ` Note: ${deletingRole.userCount} user(s) currently have this role and must be reassigned first.`
                  : ""
              }`
            : ""
        }
        confirmText="Delete Role"
        variant="danger"
        isLoading={isPending}
      />
    </>
  );
}

