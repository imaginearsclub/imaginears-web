/**
 * Session Manager
 * 
 * Handles session lifecycle, limits, activity tracking, and security.
 */

import { prisma } from "./prisma";
import {
  getSessionContext,
  calculateTrustLevel,
  isSuspiciousActivity,
  SESSION_LIMITS,
  getSessionExpiration,
  type SessionContext,
  type ActivityLog,
} from "./session-utils";

// ========== SESSION CREATION & ENHANCEMENT ==========

export interface CreateSessionParams {
  userId: string;
  token: string;
  isRememberMe?: boolean;
  loginMethod?: string;
}

/**
 * Create a new enhanced session with device and location tracking
 */
export async function createEnhancedSession(params: CreateSessionParams) {
  const { userId, token, isRememberMe = false, loginMethod = "password" } = params;

  // Get current context
  const context = await getSessionContext();

  // Check session limits
  const userSessions = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      deviceName: true,
      lastActivityAt: true,
    },
    orderBy: { lastActivityAt: "desc" },
  });

  // If user has too many sessions, remove the oldest ones
  if (userSessions.length >= SESSION_LIMITS.MAX_CONCURRENT_SESSIONS) {
    const sessionsToRemove = userSessions.slice(SESSION_LIMITS.MAX_CONCURRENT_SESSIONS - 1);
    await prisma.session.deleteMany({
      where: {
        id: { in: sessionsToRemove.map((s) => s.id) },
      },
    });
  }

  // Check for previous logins from this device/location
  const previousSessions = await prisma.session.findMany({
    where: {
      userId,
      OR: [
        { ipAddress: context.ip },
        { deviceName: context.deviceInfo.deviceName },
      ],
    },
    select: {
      createdAt: true,
      country: true,
      city: true,
    },
  });

  // Calculate trust level
  const isFirstSession = previousSessions.length === 0;
  const sameLocation = previousSessions.some(
    (s) => s.country === context.locationInfo.country && s.city === context.locationInfo.city
  );
  const daysSinceFirstLogin = isFirstSession
    ? 0
    : Math.floor((Date.now() - previousSessions[0].createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const trustLevel = calculateTrustLevel({
    isFirstSession,
    previousLoginCount: previousSessions.length,
    sameDevice: previousSessions.length > 0,
    sameLocation,
    daysSinceFirstLogin,
  });

  // Check for suspicious activity
  const recentSessions = previousSessions.filter(
    (s) => Date.now() - s.createdAt.getTime() < 60 * 60 * 1000 // Last hour
  );
  const rapidLocationChange =
    recentSessions.length > 0 &&
    recentSessions.some(
      (s) => s.country !== context.locationInfo.country && context.locationInfo.country !== null
    );

  const suspicious = isSuspiciousActivity({
    rapidLocationChange,
    unusualTime: false, // TODO: Implement time-based detection
    newDevice: isFirstSession,
    newLocation: !sameLocation,
    failedAttemptsRecent: 0, // TODO: Track failed attempts
    vpnDetected: false, // TODO: Implement VPN detection
  });

  // Create session with enhanced data
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: getSessionExpiration(isRememberMe),
      ipAddress: context.ip,
      userAgent: context.userAgent,
      deviceName: context.deviceInfo.deviceName,
      deviceType: context.deviceInfo.deviceType,
      browser: `${context.deviceInfo.browser} ${context.deviceInfo.browserVersion}`.trim(),
      os: `${context.deviceInfo.os} ${context.deviceInfo.osVersion}`.trim(),
      country: context.locationInfo.country,
      city: context.locationInfo.city,
      trustLevel,
      isSuspicious: suspicious,
      isRememberMe,
      loginMethod,
      lastActivityAt: new Date(),
    },
  });

  // Log the login activity
  await logSessionActivity({
    sessionId: session.id,
    action: "login",
    method: "POST",
    endpoint: "/api/auth/login",
    statusCode: 200,
    isSuspicious: suspicious,
  });

  return session;
}

// ========== SESSION ACTIVITY TRACKING ==========

export interface LogActivityParams extends ActivityLog {
  sessionId: string;
}

/**
 * Log session activity
 */
export async function logSessionActivity(params: LogActivityParams) {
  const { sessionId, action, endpoint, method, statusCode, duration, isError = false, isSuspicious = false } = params;

  const context = await getSessionContext();

  try {
    await prisma.sessionActivity.create({
      data: {
        sessionId,
        action,
        endpoint,
        method,
        statusCode,
        duration,
        isError,
        isSuspicious,
        ipAddress: context.ip,
        userAgent: context.userAgent,
      },
    });

    // Update session last activity
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  } catch (error) {
    console.error("[Session Activity] Failed to log activity:", error);
    // Don't throw - activity logging shouldn't break the request
  }
}

// ========== SESSION VALIDATION & SECURITY ==========

/**
 * Validate and update session
 */
export async function validateSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          email: true,
        },
      },
    },
  });

  if (!session) {
    return { valid: false, reason: "Session not found" };
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } });
    return { valid: false, reason: "Session expired" };
  }

  // Check for inactivity timeout
  const timeSinceActivity = Date.now() - session.lastActivityAt.getTime();
  const timeout = session.isRememberMe
    ? SESSION_LIMITS.SESSION_TIMEOUT_REMEMBER_ME
    : SESSION_LIMITS.IDLE_TIMEOUT;

  if (timeSinceActivity > timeout) {
    await prisma.session.delete({ where: { id: sessionId } });
    return { valid: false, reason: "Session timed out due to inactivity" };
  }

  // Update last activity
  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() },
  });

  return {
    valid: true,
    session,
    requiresStepUp: session.requiredStepUp,
    isSuspicious: session.isSuspicious,
  };
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string) {
  try {
    // Log the logout activity before deleting
    await logSessionActivity({
      sessionId,
      action: "logout",
      method: "POST",
      endpoint: "/api/auth/logout",
      statusCode: 200,
      isError: false,
      isSuspicious: false,
    });

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { success: true };
  } catch (error) {
    console.error("[Session] Failed to revoke session:", error);
    return { success: false, error: "Failed to revoke session" };
  }
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  try {
    const where: any = { userId };
    if (exceptSessionId) {
      where.NOT = { id: exceptSessionId };
    }

    const count = await prisma.session.deleteMany({ where });

    return { success: true, count: count.count };
  } catch (error) {
    console.error("[Session] Failed to revoke all sessions:", error);
    return { success: false, error: "Failed to revoke sessions" };
  }
}

/**
 * Update session device name (user-friendly naming)
 */
export async function updateSessionName(sessionId: string, deviceName: string) {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { deviceName },
    });

    return { success: true };
  } catch (error) {
    console.error("[Session] Failed to update session name:", error);
    return { success: false, error: "Failed to update session name" };
  }
}

/**
 * Get session analytics for a user
 */
export async function getUserSessionAnalytics(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      activities: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const activities = await prisma.sessionActivity.findMany({
    where: {
      session: { userId },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Calculate statistics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.expiresAt > new Date()).length;
  const suspiciousSessions = sessions.filter((s) => s.isSuspicious).length;
  const uniqueLocations = new Set(sessions.map((s) => `${s.country}-${s.city}`).filter(Boolean)).size;
  const uniqueDevices = new Set(sessions.map((s) => s.deviceName).filter(Boolean)).size;

  // Activity breakdown
  const activityByAction = activities.reduce((acc, activity) => {
    acc[activity.action] = (acc[activity.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSessions,
    activeSessions,
    suspiciousSessions,
    uniqueLocations,
    uniqueDevices,
    activityByAction,
    recentSessions: sessions.slice(0, 10),
    recentActivity: activities.slice(0, 20),
  };
}

/**
 * Cleanup old session activities (run periodically)
 */
export async function cleanupOldActivities() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - SESSION_LIMITS.ACTIVITY_RETENTION_DAYS);

  const deleted = await prisma.sessionActivity.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`[Session Cleanup] Deleted ${deleted.count} old activity records`);
  return deleted.count;
}

