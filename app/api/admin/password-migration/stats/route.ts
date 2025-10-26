/**
 * Password Migration Statistics API
 * 
 * GET /api/admin/password-migration/stats
 * 
 * Returns statistics about the Argon2id migration progress:
 * - Total credential accounts
 * - Accounts using Argon2id (migrated)
 * - Accounts using bcrypt (pending migration)
 * - Unknown hash formats
 * - Migration percentage
 * 
 * Security: Admin-only access
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getMigrationStats } from "@/lib/password-migration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Security: Require admin authentication
    const session = await requireAdmin();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Get migration statistics
    const stats = await getMigrationStats();

    return NextResponse.json({
      success: true,
      migration: {
        total: stats.total,
        migrated: {
          count: stats.argon2,
          percentage: stats.percentMigrated,
        },
        pending: {
          count: stats.bcrypt,
          percentage: stats.total > 0 ? Math.round((stats.bcrypt / stats.total) * 100) : 0,
        },
        unknown: stats.unknown,
        algorithm: "Argon2id",
        status: stats.percentMigrated === 100 ? "complete" : "in-progress",
      },
      recommendation:
        stats.percentMigrated < 100
          ? "Migration in progress. Users will be automatically migrated on their next login."
          : "All users have been migrated to Argon2id. Consider removing bcrypt fallback after 6-12 months.",
    });
  } catch (error) {
    console.error("[Password Migration Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve migration statistics" },
      { status: 500 }
    );
  }
}

