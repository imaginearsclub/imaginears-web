import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { syncPlayersFromAPI } from "@/lib/minecraft-analytics-api";
import { prisma } from "@/lib/prisma";

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
