import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { getTopEvents } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/events?limit=10
 * 
 * Get event analytics data
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
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Fetch top events
    const topEvents = await getTopEvents(limit);

    return NextResponse.json({
      topEvents: topEvents.map((e) => ({
        eventId: e.eventId,
        eventTitle: e.eventTitle,
        category: e.category,
        startAt: e.startAt.toISOString(),
        totalViews: e.totalViews,
        uniqueVisitors: e.uniqueVisitors,
        totalClicks: e.totalClicks,
        favoriteCount: e.favoriteCount,
      })),
    });
  } catch (error) {
    console.error("[Analytics API] Events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event analytics" },
      { status: 500 }
    );
  }
}

