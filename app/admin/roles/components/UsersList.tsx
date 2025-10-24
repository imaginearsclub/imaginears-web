"use client";

import { useState, useTransition } from "react";
import {
  Avatar,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common";
import { getRoleLabel, getRoleBadgeVariant, getRolePermissions, SYSTEM_ROLES } from "@/lib/rbac";

// Helper to get initials from a name or email
function getInitials(text: string): string {
  return text
    .split(/[\s@]+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  minecraftName?: string | null;
  role: string; // Can be system role or custom role slug
  permissions: any;
  image: string | null;
  createdAt: Date;
  _count: {
    sessions: number;
  };
}

interface UsersListProps {
  users: User[];
  currentUserId: string;
  updateRoleAction: (formData: FormData) => Promise<any>;
  updatePermissionsAction: (formData: FormData) => Promise<any>;
}

export function UsersList({
  users,
  currentUserId,
  updateRoleAction,
}: UsersListProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [...SYSTEM_ROLES] as const;

  const handleRoleChange = (userId: string, newRole: string) => {
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("role", newRole);

    startTransition(async () => {
      try {
        const result = await updateRoleAction(formData);
        if (result?.success) {
          setSuccess(result.message || "Role updated successfully");
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to update role");
      }
    });
  };

  const openUserDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setError(null);
    setSuccess(null);
  };

  const closeUserDialog = () => {
    setSelectedUser(null);
    setSelectedRole(null);
  };

  const handleSaveRole = () => {
    if (!selectedUser || !selectedRole) return;
    
    handleRoleChange(selectedUser.id, selectedRole);
    closeUserDialog();
  };

  return (
    <div className="space-y-4">
      {/* Feedback Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-200/60 dark:border-slate-800/60">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                User
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {users.map((user) => {
              const displayName = user.minecraftName || user.name || user.email || "Unknown User";
              const isCurrentUser = user.id === currentUserId;
              const hasActiveSessions = user._count.sessions > 0;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        fallback={getInitials(displayName)}
                        {...(user.image && { src: user.image })}
                        alt={displayName}
                        size="md"
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {displayName}
                          {isCurrentUser && (
                            <Badge variant="default" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        {user.email && (
                          <div className="text-xs text-slate-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {hasActiveSessions ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Active
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openUserDialog(user)}
                      disabled={isPending}
                      className="btn btn-sm btn-ghost"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No users found
        </div>
      )}

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && closeUserDialog()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser.name || selectedUser.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current User Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                <Avatar
                  fallback={getInitials(selectedUser.name || selectedUser.email || "U")}
                  {...(selectedUser.image && { src: selectedUser.image })}
                  alt={selectedUser.name || selectedUser.email || "User"}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {selectedUser.name || selectedUser.email}
                  </div>
                  {selectedUser.email && selectedUser.name && (
                    <div className="text-xs text-slate-500 truncate">
                      {selectedUser.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium mb-2">
                  Role *
                </label>
                <Select
                  value={selectedRole || selectedUser.role}
                  onValueChange={(value) => setSelectedRole(value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Permissions Preview */}
              {selectedRole && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Role Permissions
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {getRolePermissions(selectedRole as any).slice(0, 8).map((perm) => (
                      <span
                        key={perm}
                        className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs"
                      >
                        {perm}
                      </span>
                    ))}
                    {getRolePermissions(selectedRole as any).length > 8 && (
                      <span className="inline-block text-blue-600 dark:text-blue-400 px-2 py-0.5 text-xs">
                        +{getRolePermissions(selectedRole as any).length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={closeUserDialog}
                className="btn btn-outline"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="btn btn-primary"
                disabled={isPending || !selectedRole || selectedRole === selectedUser.role}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

