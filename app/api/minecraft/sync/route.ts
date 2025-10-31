import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { syncPlayersFromAPI } from "@/lib/minecraft-analytics-api";
import { prisma } from "@/lib/prisma";
import { triggerWebhook, WEBHOOK_EVENTS } from "@/lib/webhooks";

/**
 * POST /api/minecraft/sync
 * 
 * Manually trigger a sync of player data from Minecraft Player Analytics API
 * Requires: analytics:read permission
 */
export async function POST() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission
    if (!(await userHasPermissionAsync(user.role, "analytics:read"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await syncPlayersFromAPI();

    // Trigger webhook based on result
    if (result.success) {
      triggerWebhook(WEBHOOK_EVENTS.SYNC_COMPLETED, {
        synced: result.synced,
        linked: result.linked,
        errors: result.errors || 0,
        message: result.message,
      }, {
        userId: session.user.id,
      }).catch(err => console.error("[MC Sync] Webhook trigger failed:", err));
    } else {
      triggerWebhook(WEBHOOK_EVENTS.SYNC_FAILED, {
        message: result.message,
      }, {
        userId: session.user.id,
      }).catch(err => console.error("[MC Sync] Webhook trigger failed:", err));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[MC Sync] Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
