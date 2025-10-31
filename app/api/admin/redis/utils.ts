/**
 * Shared utilities for Redis API endpoints
 */

import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { checkPermission } from "@/lib/role-security";

// Permission required for Redis operations
export const REDIS_PERMISSION = "system:logs" as const;

/**
 * Check if user has access to Redis operations (Owner/Admin only)
 * @param userId - User ID to check
 * @returns True if user is Owner or Admin
 */
export async function checkRedisAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });

  if (!user) {
    log.warn("Redis access check - user not found", { userId });
    return false;
  }

  // Check if user is Owner or Admin
  if (user.role !== "OWNER" && user.role !== "ADMIN") {
    log.warn("Redis access check - insufficient permissions", {
      userId,
      role: user.role,
      email: user.email,
    });
    return false;
  }

  return true;
}

/**
 * Alternative: Use permission-based check
 * @param userId - User ID to check
 * @returns True if user has system:logs permission
 */
export async function checkRedisPermission(userId: string): Promise<boolean> {
  return await checkPermission(userId, REDIS_PERMISSION);
}

