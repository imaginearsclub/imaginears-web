import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import {
  getPageViews,
  getUniqueVisitors,
  getTopPages,
  getDeviceBreakdown,
  getDateRange,
  getActivePlayers,
} from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/overview?period=week
 * 
 * Get analytics overview data
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
    const period = (searchParams.get("period") || "week") as "today" | "week" | "month" | "quarter" | "year";

    const { startDate, endDate } = getDateRange(period);

    // Fetch analytics data in parallel
    const [pageViews, uniqueVisitors, topPages, deviceBreakdown, activePlayers] =
      await Promise.all([
        getPageViews(startDate, endDate),
        getUniqueVisitors(startDate, endDate),
        getTopPages(startDate, endDate, 10),
        getDeviceBreakdown(startDate, endDate),
        getActivePlayers(30),
      ]);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      pageViews,
      uniqueVisitors,
      topPages,
      deviceBreakdown,
      activePlayers: activePlayers.length,
    });
  } catch (error) {
    console.error("[Analytics API] Overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

