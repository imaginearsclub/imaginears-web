import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { markAllAsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/read-all
 * 
 * Mark all notifications as read for the current user
 */
export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const count = await markAllAsRead(session.user.id);

    return NextResponse.json({ 
      success: true,
      count,
      message: `Marked ${count} notification${count === 1 ? "" : "s"} as read`
    });
  } catch (error) {
    console.error("[Notifications API] Mark all as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}

