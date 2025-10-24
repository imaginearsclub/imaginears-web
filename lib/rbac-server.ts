/**
 * Role-Based Access Control (RBAC) System - Server-Only Functions
 * 
 * This file contains functions that require database access.
 * These can only be used in Server Components and Server Actions.
 * 
 * For client-safe functions, see lib/rbac.ts
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { isSystemRole, ROLE_PERMISSIONS, type Permission } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

/**
 * Get permissions for a role (checks both system and custom roles)
 * For custom roles, this requires a database lookup
 */
export async function getRolePermissionsAsync(roleSlug: string): Promise<Permission[]> {
  // Check if it's a system role first
  if (isSystemRole(roleSlug)) {
    return ROLE_PERMISSIONS[roleSlug as UserRole] ?? [];
  }

  // Otherwise, look up custom role in database
  try {
    const customRole = await (prisma as any).customRole.findUnique({
      where: { slug: roleSlug },
      select: { permissions: true },
    });

    if (customRole && Array.isArray(customRole.permissions)) {
      return customRole.permissions as Permission[];
    }

    return [];
  } catch (error) {
    console.error("[RBAC] Error fetching custom role:", error);
    return [];
  }
}

/**
 * Check if a user has a specific permission (async version for custom roles)
 * Checks in order: custom permissions > role permissions
 */
export async function userHasPermissionAsync(
  roleSlug: string,
  permission: Permission,
  customPermissions?: Record<string, boolean> | null
): Promise<boolean> {
  // Check custom permissions first (they override role permissions)
  if (customPermissions && permission in customPermissions) {
    return customPermissions[permission] === true;
  }

  // Get role permissions (handles both system and custom roles)
  const permissions = await getRolePermissionsAsync(roleSlug);
  return permissions.includes(permission);
}

/**
 * Get all available roles (system + custom)
 */
export async function getAllRoles(): Promise<Array<{
  slug: string;
  name: string;
  description: string;
  isSystem: boolean;
  color?: string | null;
}>> {
  // Get custom roles from database
  const customRoles = await (prisma as any).customRole.findMany({
    select: {
      slug: true,
      name: true,
      description: true,
      isSystem: true,
      color: true,
    },
    orderBy: [
      { isSystem: "desc" }, // System roles first
      { name: "asc" },
    ],
  });

  return customRoles.map((role: any) => ({
    ...role,
    description: role.description || "",
  }));
}

/**
 * Get role information (works for both system and custom roles)
 */
export async function getRoleInfo(roleSlug: string): Promise<{
  name: string;
  description: string;
  color: string | null;
} | null> {
  try {
    const role = await (prisma as any).customRole.findUnique({
      where: { slug: roleSlug },
      select: { name: true, description: true, color: true },
    });

    return role ? {
      name: role.name,
      description: role.description || "",
      color: role.color,
    } : null;
  } catch (error) {
    console.error("[RBAC] Error fetching role info:", error);
    return null;
  }
}

