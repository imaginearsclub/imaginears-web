import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { deleteNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/notifications/[id]
 * 
 * Delete a notification
 */
export async function DELETE(
  _request: NextRequest,
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
    const success = await deleteNotification(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notifications API] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

