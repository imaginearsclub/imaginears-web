import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { testAPIConnection } from "@/lib/minecraft-analytics-api";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/minecraft/sync/test
 * 
 * Test connection to Minecraft Player Analytics API
 * Requires: analytics:read permission
 */
export async function GET() {
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

    const result = await testAPIConnection();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[MC Sync] Test error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

