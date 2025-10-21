import "server-only";

import { requireAdmin as requireAdminFromSession } from "@/lib/session";

/**
 * Compatibility wrapper for older imports that expected iron-session based helpers.
 * This delegates to the hardened Better-Auth helpers in lib/session.ts.
 *
 * Usage in route handlers:
 *   await requireAdminSession();
 *
 * Behavior:
 *  - Resolves when the requester has an active session AND an admin/owner org role.
 *  - Throws Error("UNAUTHORIZED") otherwise (both unauthenticated and unauthorized),
 *    matching existing caller expectations that catch and map this to 401.
 */
export async function requireAdminSession() {
  const session = await requireAdminFromSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
