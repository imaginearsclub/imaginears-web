/**
 * Shared utilities for Sessions API endpoints
 */

import { checkPermission } from "@/lib/role-security";

export const SESSIONS_PERMISSIONS = {
  VIEW_ALL: "sessions:view_all",
  REVOKE_ANY: "sessions:revoke_any",
  VIEW_ANALYTICS: "sessions:view_analytics",
} as const;

export async function checkSessionsPermission(userId: string, permission: string): Promise<boolean> {
  return await checkPermission(userId, permission);
}
