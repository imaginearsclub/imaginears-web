import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/test
 * 
 * Create test notifications for the current user
 * (DEV/TESTING ONLY - Remove in production)
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

    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const notifications = [];

    // 1. Security - New device login
    notifications.push(
      await createNotification({
        userId,
        ...NotificationTemplates.newDeviceLogin("Chrome on Windows", "New York, US"),
        actionUrl: "/profile/security",
        actionText: "Review Login",
      })
    );

    // 2. Security - Suspicious activity
    notifications.push(
      await createNotification({
        userId,
        ...NotificationTemplates.suspiciousActivity("Multiple failed login attempts"),
        actionUrl: "/profile/security",
        actionText: "Secure Account",
      })
    );

    // 3. Event - Starting soon
    notifications.push(
      await createNotification({
        userId,
        ...NotificationTemplates.eventStartingSoon("Build Competition Finals", 15),
        actionUrl: "/events",
        actionText: "View Event",
      })
    );

    // 4. Player - Joined (for admins)
    notifications.push(
      await createNotification({
        userId,
        ...NotificationTemplates.playerJoined("Steve_2024"),
        actionUrl: "/admin/players",
        actionText: "View Players",
      })
    );

    // 5. Session - Expiring
    notifications.push(
      await createNotification({
        userId,
        ...NotificationTemplates.sessionExpiringSoon(10),
        actionUrl: "/profile",
        actionText: "Stay Active",
      })
    );

    // 6. System - Maintenance
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    notifications.push(
      await createNotification({
        userId,
        ...NotificationTemplates.maintenanceScheduled(tomorrow, 2),
        actionUrl: "/",
        actionText: "Learn More",
      })
    );

    // 7. Info notification
    notifications.push(
      await createNotification({
        userId,
        title: "Welcome to Imaginears!",
        message: "Thanks for joining our community. Check out upcoming events and get started with your first build!",
        type: "info",
        category: "system",
        priority: "low",
        actionUrl: "/events",
        actionText: "Browse Events",
      })
    );

    // 8. Success notification
    notifications.push(
      await createNotification({
        userId,
        title: "Application Approved",
        message: "Congratulations! Your staff application has been approved. Welcome to the team!",
        type: "success",
        category: "system",
        priority: "high",
        actionUrl: "/profile",
        actionText: "View Profile",
      })
    );

    return NextResponse.json({
      success: true,
      count: notifications.length,
      message: `Created ${notifications.length} test notifications`,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type,
        priority: n.priority,
      })),
    });
  } catch (error) {
    console.error("[Notifications Test API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create test notifications" },
      { status: 500 }
    );
  }
}

