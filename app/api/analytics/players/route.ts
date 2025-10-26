import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { getActivePlayers, getPlayerRetention } from "@/lib/analytics";
import { getTopPlayersByPlaytime } from "@/lib/minecraft-analytics";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/players?days=30
 * 
 * Get player analytics data
 * Requires: analytics:read permission
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Fetch player analytics data
    const [activePlayers, retention, topPlayers] = await Promise.all([
      getActivePlayers(days),
      getPlayerRetention(),
      getTopPlayersByPlaytime(10),
    ]);

    return NextResponse.json({
      activePlayers: activePlayers.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        minecraftName: p.minecraftName,
        minecraftUuid: p.minecraftUuid,
        totalWebVisits: p.totalWebVisits,
        totalMinecraftTime: p.totalMinecraftTime,
        totalMinecraftJoins: p.totalMinecraftJoins,
        webEngagementScore: p.webEngagementScore,
        mcEngagementScore: p.mcEngagementScore,
        overallEngagement: p.overallEngagement,
        lastActiveAt: p.lastActiveAt.toISOString(),
      })),
      retention,
      topPlayers: topPlayers.map((p: any) => ({
        minecraftName: p.minecraftName,
        totalMinecraftTime: p.totalMinecraftTime,
        totalMinecraftJoins: p.totalMinecraftJoins,
      })),
    });
  } catch (error) {
    console.error("[Analytics API] Players error:", error);
    return NextResponse.json(
      { error: "Failed to fetch player analytics" },
      { status: 500 }
    );
  }
}

