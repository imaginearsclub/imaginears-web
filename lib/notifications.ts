import { prisma } from "./prisma";
import type { Notification, NotificationPreferences } from "@prisma/client";
import { triggerWebhook, WEBHOOK_EVENTS } from "./webhooks";

/**
 * Notification Types
 */
export type NotificationType = "info" | "success" | "warning" | "error" | "security" | "event" | "player" | "system";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationCategory = "security" | "events" | "players" | "sessions" | "system" | "announcement";

/**
 * Create Notification Input
 */
export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  category: NotificationCategory;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Create a notification for a user
 * @param input - Notification data
 * @returns Created notification
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      priority: input.priority || "normal",
      category: input.category,
      actionUrl: input.actionUrl ?? null,
      actionText: input.actionText ?? null,
      metadata: (input.metadata as any) ?? null,
      expiresAt: input.expiresAt ?? null,
      deliveredVia: ["in_app"], // Start with in-app, can add email later
    },
  });

  // Real-time notification broadcast (if WebSocket is enabled)
  if (process.env['ENABLE_REALTIME_NOTIFICATIONS'] === "true") {
    try {
      const { broadcast, CHANNELS } = await import("./websocket-server");
      broadcast("notification:new", {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        category: notification.category,
        ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
        ...(notification.actionText && { actionText: notification.actionText }),
        createdAt: notification.createdAt.toISOString(),
      }, {
        userId: input.userId,
        channel: CHANNELS.NOTIFICATIONS,
      });
    } catch (error) {
      console.error("[Notifications] Failed to broadcast:", error);
    }
  }

  // TODO: Send email notification if user preferences allow

  // Trigger webhook
  triggerWebhook(WEBHOOK_EVENTS.NOTIFICATION_CREATED, {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    category: notification.category,
    userId: input.userId,
  }).catch(err => console.error("[Notifications] Webhook trigger failed:", err));

  return notification;
}

/**
 * Create notification for multiple users
 * @param userIds - Array of user IDs
 * @param input - Notification data (without userId)
 * @returns Created notifications
 */
export async function createBulkNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
): Promise<Notification[]> {
  const notifications = await prisma.$transaction(
    userIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: input.title,
          message: input.message,
          type: input.type,
          priority: input.priority || "normal",
          category: input.category,
          actionUrl: input.actionUrl ?? null,
          actionText: input.actionText ?? null,
          metadata: (input.metadata as any) ?? null,
          expiresAt: input.expiresAt ?? null,
          deliveredVia: ["in_app"],
        },
      })
    )
  );

  return notifications;
}

/**
 * Get user's notifications (with pagination)
 * @param userId - User ID
 * @param options - Query options
 * @returns Notifications and count
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: NotificationCategory;
    includeArchived?: boolean;
  } = {}
) {
  const {
    limit = 50,
    offset = 0,
    unreadOnly = false,
    category,
    includeArchived = false,
  } = options;

  const where: any = {
    userId,
  };

  if (unreadOnly) {
    where.isRead = false;
  }

  if (category) {
    where.category = category;
  }

  if (!includeArchived) {
    where.isArchived = false;
  }

  // Don't show expired notifications
  where.OR = [
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ];

  const [notifications, totalCount, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: [
        { priority: "desc" }, // Urgent first
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isArchived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    }),
  ]);

  return {
    notifications,
    totalCount,
    unreadCount,
    hasMore: offset + limit < totalCount,
  };
}

/**
 * Mark notification as read
 * @param notificationId - Notification ID
 * @param userId - User ID (for security check)
 * @returns Updated notification
 */
export async function markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 * @param userId - User ID
 * @returns Count of updated notifications
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Archive a notification
 * @param notificationId - Notification ID
 * @param userId - User ID (for security check)
 * @returns Updated notification
 */
export async function archiveNotification(notificationId: string, userId: string): Promise<Notification | null> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });
}

/**
 * Delete a notification
 * @param notificationId - Notification ID
 * @param userId - User ID (for security check)
 * @returns True if deleted
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return false;
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return true;
}

/**
 * Get or create notification preferences for a user
 * @param userId - User ID
 * @returns Notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  let preferences = await prisma.notificationPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    // Create default preferences
    preferences = await prisma.notificationPreferences.create({
      data: { userId },
    });
  }

  return preferences;
}

/**
 * Update notification preferences
 * @param userId - User ID
 * @param updates - Preference updates
 * @returns Updated preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<Omit<NotificationPreferences, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<NotificationPreferences> {
  // Ensure preferences exist
  await getNotificationPreferences(userId);

  return await prisma.notificationPreferences.update({
    where: { userId },
    data: updates,
  });
}

/**
 * Check if user should receive notification based on preferences
 * @param userId - User ID
 * @param category - Notification category
 * @returns True if notification should be sent
 */
export async function shouldNotifyUser(userId: string, category: NotificationCategory): Promise<boolean> {
  const preferences = await getNotificationPreferences(userId);

  if (!preferences.inAppEnabled) {
    return false;
  }

  // Check category preferences
  const categoryMap: Record<NotificationCategory, keyof NotificationPreferences> = {
    security: "securityAlerts",
    events: "eventReminders",
    players: "playerAlerts",
    sessions: "sessionAlerts",
    system: "systemAnnouncements",
    announcement: "systemAnnouncements",
  };

  const preferenceKey = categoryMap[category];
  return preferences[preferenceKey] as boolean;
}

/**
 * Clean up expired notifications (should be run periodically)
 * @returns Count of archived notifications
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
      isArchived: false,
    },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Predefined notification templates for common scenarios
 */
export const NotificationTemplates = {
  /**
   * Security: New device login
   */
  newDeviceLogin: (deviceName: string, location: string): Pick<CreateNotificationInput, "title" | "message" | "type" | "category" | "priority"> => ({
    title: "New Device Login Detected",
    message: `A new login was detected from ${deviceName} in ${location}. If this wasn't you, please secure your account immediately.`,
    type: "security",
    category: "security",
    priority: "high",
  }),

  /**
   * Security: Suspicious activity
   */
  suspiciousActivity: (reason: string): Pick<CreateNotificationInput, "title" | "message" | "type" | "category" | "priority"> => ({
    title: "Suspicious Activity Detected",
    message: `We detected unusual activity on your account: ${reason}. Please review your recent sessions.`,
    type: "error",
    category: "security",
    priority: "urgent",
  }),

  /**
   * Events: Event starting soon
   */
  eventStartingSoon: (eventTitle: string, minutesUntil: number): Pick<CreateNotificationInput, "title" | "message" | "type" | "category"> => ({
    title: "Event Starting Soon",
    message: `"${eventTitle}" is starting in ${minutesUntil} minutes!`,
    type: "event",
    category: "events",
  }),

  /**
   * Players: Player joined (for admins)
   */
  playerJoined: (playerName: string): Pick<CreateNotificationInput, "title" | "message" | "type" | "category"> => ({
    title: "Player Joined",
    message: `${playerName} has joined the server.`,
    type: "player",
    category: "players",
  }),

  /**
   * Sessions: Session expiring soon
   */
  sessionExpiringSoon: (minutesUntil: number): Pick<CreateNotificationInput, "title" | "message" | "type" | "category"> => ({
    title: "Session Expiring Soon",
    message: `Your session will expire in ${minutesUntil} minutes. Save your work or stay active to keep it alive.`,
    type: "warning",
    category: "sessions",
  }),

  /**
   * System: Maintenance scheduled
   */
  maintenanceScheduled: (startTime: Date, duration: number): Pick<CreateNotificationInput, "title" | "message" | "type" | "category" | "priority"> => ({
    title: "Scheduled Maintenance",
    message: `System maintenance is scheduled for ${startTime.toLocaleString()}. Expected duration: ${duration} hours.`,
    type: "info",
    category: "system",
    priority: "normal",
  }),
};

