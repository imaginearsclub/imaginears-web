import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/preferences
 * 
 * Get user's notification preferences
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preferences = await getNotificationPreferences(session.user.id);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[Notifications API] GET preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * 
 * Update user's notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const allowedFields = [
      "inAppEnabled",
      "emailEnabled",
      "pushEnabled",
      "securityAlerts",
      "eventReminders",
      "playerAlerts",
      "sessionAlerts",
      "systemAnnouncements",
      "digestEnabled",
      "digestFrequency",
      "quietHoursEnabled",
      "quietHoursStart",
      "quietHoursEnd",
      "soundEnabled",
      "desktopNotifications",
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    const preferences = await updateNotificationPreferences(session.user.id, updates);

    return NextResponse.json({ 
      success: true,
      preferences,
      message: "Notification preferences updated successfully"
    });
  } catch (error) {
    console.error("[Notifications API] PUT preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}

