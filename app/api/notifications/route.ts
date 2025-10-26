import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getUserNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * 
 * Get user's notifications with pagination and filtering
 * 
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - unreadOnly: boolean (default: false)
 * - category: string (optional)
 * - includeArchived: boolean (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const category = searchParams.get("category") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const result = await getUserNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly,
      category: category as any,
      includeArchived,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Notifications API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

