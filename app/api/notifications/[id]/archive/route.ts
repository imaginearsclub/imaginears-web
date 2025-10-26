import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { archiveNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/[id]/archive
 * 
 * Archive a notification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const notification = await archiveNotification(id, session.user.id);

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("[Notifications API] Archive error:", error);
    return NextResponse.json(
      { error: "Failed to archive notification" },
      { status: 500 }
    );
  }
}

