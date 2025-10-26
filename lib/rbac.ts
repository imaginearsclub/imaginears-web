/**
 * Role-Based Access Control (RBAC) System - Client-Safe Functions
 * 
 * This file contains pure functions that don't require database access.
 * For server-side functions that need database access, see lib/rbac-server.ts
 */

import { UserRole } from "@prisma/client";

// Permission strings follow the pattern: "resource:action"
// Examples: "events:write", "applications:read", "users:delete"

export type Permission =
  // Events
  | "events:read"
  | "events:write"
  | "events:delete"
  | "events:publish"
  // Applications
  | "applications:read"
  | "applications:write"
  | "applications:delete"
  | "applications:approve"
  // Players/Users
  | "players:read"
  | "players:write"
  | "players:ban"
  // Users (admin users)
  | "users:read"
  | "users:write"
  | "users:delete"
  | "users:manage_roles"
  // Bulk User Operations
  | "users:bulk_operations"
  | "users:bulk_suspend"
  | "users:bulk_activate"
  | "users:bulk_change_roles"
  | "users:bulk_reset_passwords"
  | "users:bulk_send_email"
  // Sessions
  | "sessions:view_own"
  | "sessions:view_all"
  | "sessions:view_analytics"
  | "sessions:revoke_own"
  | "sessions:revoke_any"
  | "sessions:configure_policies"
  | "sessions:view_health"
  // Settings
  | "settings:read"
  | "settings:write"
  | "settings:security"
  // Analytics
  | "analytics:read"
  | "analytics:export"
  // Dashboard
  | "dashboard:view"
  | "dashboard:stats"
  // System
  | "system:maintenance"
  | "system:logs";

/**
 * Define permissions for each role
 * Roles inherit permissions in this hierarchy:
 * OWNER > ADMIN > MODERATOR > STAFF > USER
 */
export const ROLE_PERMISSIONS: any = {
  // OWNER: Full system access
  OWNER: [
    // Events
    "events:read",
    "events:write",
    "events:delete",
    "events:publish",
    // Applications
    "applications:read",
    "applications:write",
    "applications:delete",
    "applications:approve",
    // Players
    "players:read",
    "players:write",
    "players:ban",
    // Users
    "users:read",
    "users:write",
    "users:delete",
    "users:manage_roles",
    // Bulk Operations (all)
    "users:bulk_operations",
    "users:bulk_suspend",
    "users:bulk_activate",
    "users:bulk_change_roles",
    "users:bulk_reset_passwords",
    "users:bulk_send_email",
    // Sessions (all)
    "sessions:view_own",
    "sessions:view_all",
    "sessions:view_analytics",
    "sessions:revoke_own",
    "sessions:revoke_any",
    "sessions:configure_policies",
    "sessions:view_health",
    // Settings
    "settings:read",
    "settings:write",
    "settings:security",
    // Analytics
    "analytics:read",
    "analytics:export",
    // Dashboard
    "dashboard:view",
    "dashboard:stats",
    // System
    "system:maintenance",
    "system:logs",
  ],

  // ADMIN: Can manage most features except critical system settings
  ADMIN: [
    // Events
    "events:read",
    "events:write",
    "events:delete",
    "events:publish",
    // Applications
    "applications:read",
    "applications:write",
    "applications:delete",
    "applications:approve",
    // Players
    "players:read",
    "players:write",
    "players:ban",
    // Users
    "users:read",
    "users:write",
    // Bulk Operations (most, not role changes)
    "users:bulk_operations",
    "users:bulk_suspend",
    "users:bulk_activate",
    "users:bulk_reset_passwords",
    "users:bulk_send_email",
    // Note: users:bulk_change_roles excluded (prevent self-promotion)
    // Sessions (all except configure policies)
    "sessions:view_own",
    "sessions:view_all",
    "sessions:view_analytics",
    "sessions:revoke_own",
    "sessions:revoke_any",
    "sessions:view_health",
    // Note: sessions:configure_policies excluded (critical security)
    // Settings
    "settings:read",
    "settings:write",
    // Analytics
    "analytics:read",
    "analytics:export",
    // Dashboard
    "dashboard:view",
    "dashboard:stats",
    // System
    "system:logs",
  ],

  // MODERATOR: Can manage content and moderate users
  MODERATOR: [
    // Events
    "events:read",
    "events:write",
    "events:publish",
    // Applications
    "applications:read",
    "applications:write",
    "applications:approve",
    // Players
    "players:read",
    "players:write",
    // Users
    "users:read",
    // Sessions (view only, no bulk operations)
    "sessions:view_own",
    "sessions:view_all",
    "sessions:view_analytics",
    "sessions:revoke_own",
    // Note: No bulk operations or policy configuration
    // Settings
    "settings:read",
    // Analytics
    "analytics:read",
    // Dashboard
    "dashboard:view",
    "dashboard:stats",
  ],

  // STAFF: Can view and assist, limited editing
  STAFF: [
    // Events
    "events:read",
    "events:write",
    // Applications
    "applications:read",
    "applications:write",
    // Players
    "players:read",
    // Users
    "users:read",
    // Sessions (own only)
    "sessions:view_own",
    "sessions:revoke_own",
    // Settings
    "settings:read",
    // Dashboard
    "dashboard:view",
  ],

  // USER: Basic authenticated access
  USER: [
    // Sessions (own only)
    "sessions:view_own",
    "sessions:revoke_own",
    // Dashboard
    "dashboard:view",
  ],
};

/**
 * System roles (protected, cannot be deleted)
 */
export const SYSTEM_ROLES = ["OWNER", "ADMIN", "MODERATOR", "STAFF", "USER"] as const;
export type SystemRole = typeof SYSTEM_ROLES[number];

/**
 * Admin roles that have full or elevated access
 */
export const ADMIN_ROLES = new Set<string>(["OWNER", "ADMIN"]);

/**
 * Staff roles that have content management access
 */
export const STAFF_ROLES = new Set<string>([
  "OWNER",
  "ADMIN",
  "MODERATOR",
  "STAFF",
]);

/**
 * Check if a role string is a system role
 */
export function isSystemRole(role: string): role is SystemRole {
  return SYSTEM_ROLES.includes(role as any);
}

/**
 * Check if a role has a specific permission (system roles only, synchronous)
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user (with role and custom permissions) has a specific permission
 * Synchronous version - only works for system roles
 * For custom roles, use userHasPermissionAsync instead
 */
export function userHasPermission(
  role: UserRole,
  permission: Permission,
  customPermissions?: Record<string, boolean> | null
): boolean {
  // Check custom permissions first (they override role permissions)
  if (customPermissions && permission in customPermissions) {
    return customPermissions[permission] === true;
  }

  // Fall back to role-based permissions
  return roleHasPermission(role, permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if a role is an admin role (works for both system and custom roles)
 */
export function isAdminRole(roleSlug: string): boolean {
  return ADMIN_ROLES.has(roleSlug);
}

/**
 * Check if a role is a staff role (includes admins)
 */
export function isStaffRole(roleSlug: string): boolean {
  return STAFF_ROLES.has(roleSlug);
}


/**
 * Get a human-readable description for each role (system roles fallback)
 */
export function getRoleDescription(role: string): string {
  const descriptions: any = {
    OWNER: "Full system access. Can manage everything including critical settings.",
    ADMIN: "Can manage most features, users, and settings. Cannot access critical security settings.",
    MODERATOR: "Can manage events, applications, and players. Limited settings access.",
    STAFF: "Can view and assist with events and applications. Read-only for most features.",
    USER: "Basic authenticated access. Can view own information and public content.",
  };

  return descriptions[role] ?? "Unknown role";
}

/**
 * Get a human-readable label for each role (system roles fallback)
 */
export function getRoleLabel(role: string): string {
  const labels: any = {
    OWNER: "Owner",
    ADMIN: "Administrator",
    MODERATOR: "Moderator",
    STAFF: "Staff Member",
    USER: "User",
  };

  return labels[role] ?? role;
}

/**
 * Get role badge color/variant for UI (system roles fallback)
 */
export function getRoleBadgeVariant(role: string): "default" | "success" | "warning" | "danger" {
  const variants: any = {
    OWNER: "danger",
    ADMIN: "success",
    MODERATOR: "default",
    STAFF: "default",
    USER: "default",
  };

  return variants[role] ?? "default";
}

