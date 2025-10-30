/**
 * Shared utilities for media API endpoints
 */

import { prisma } from "@/lib/prisma";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { type Permission } from "@/lib/rbac";
import { log } from "@/lib/logger";
import type { Media } from "@prisma/client";

// Constants for media operations
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const VALID_CATEGORIES = ["audio", "images", "documents"] as const;
export type MediaCategory = typeof VALID_CATEGORIES[number];

/**
 * Check if user has a specific media permission
 * @param userId - User ID to check
 * @param permission - Permission to verify
 * @param mediaId - Optional media ID for context logging
 * @returns True if user has permission
 */
export async function checkMediaPermission(
  userId: string,
  permission: Permission,
  mediaId?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    log.warn("Media permission check failed - user not found", { userId, permission, mediaId });
    return false;
  }

  const hasPermission = await userHasPermissionAsync(user.role, permission);
  
  if (!hasPermission) {
    log.warn("Media permission denied", { userId, role: user.role, permission, mediaId });
  }

  return hasPermission;
}

/**
 * Safely release buffer memory by triggering GC
 * Note: JavaScript doesn't allow manual memory deallocation
 * This function helps trigger garbage collection if available
 */
export function releaseBuffer(): void {
  // Memory: Trigger GC if --expose-gc flag is set
  if (global.gc) {
    global.gc();
  }
}

/**
 * Validate media category
 * @param category - Category to validate
 * @returns True if valid
 */
export function isValidCategory(category: string): category is MediaCategory {
  return VALID_CATEGORIES.includes(category as MediaCategory);
}

/**
 * Parse tags from string input
 * @param tagsStr - JSON string or undefined
 * @returns Parsed tags array or undefined
 */
export function parseTags(tagsStr?: string): string[] | undefined {
  if (!tagsStr) return undefined;
  
  try {
    return JSON.parse(tagsStr);
  } catch (error) {
    log.warn("Failed to parse tags JSON", { error, tagsStr });
    return undefined;
  }
}

/**
 * Build media response with child count
 * @param media - Media record from database
 * @returns Media with child count added
 */
export function formatMediaResponse(media: Media & { children?: { id: string }[] }): Media & { childCount?: number | undefined } {
  return {
    ...media,
    childCount: media.children?.length ?? undefined,
  };
}

