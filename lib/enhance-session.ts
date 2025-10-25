/**
 * Session Enhancement Utility
 * 
 * Updates existing Better-Auth sessions with enhanced tracking data.
 * This bridges the gap between Better-Auth's session creation and our
 * enhanced session management system.
 */

import { prisma } from "./prisma";
import { getSessionContext, calculateTrustLevel, isSuspiciousActivity } from "./session-utils";

/**
 * Enhance an existing session with device and location tracking
 */
export async function enhanceExistingSession(sessionToken: string) {
  try {
    // Get the session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check if session already has enhanced data
    if (session.deviceName && session.country) {
      // Already enhanced, just update last activity
      await prisma.session.update({
        where: { token: sessionToken },
        data: { lastActivityAt: new Date() },
      });
      return session;
    }

    // Get current context
    const context = await getSessionContext();

    // Check for previous sessions from this user
    const previousSessions = await prisma.session.findMany({
      where: {
        userId: session.userId,
        NOT: { id: session.id },
        OR: [
          { ipAddress: context.ip },
          { country: context.locationInfo.country },
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
      unusualTime: false,
      newDevice: isFirstSession,
      newLocation: !sameLocation,
      failedAttemptsRecent: 0,
      vpnDetected: false,
    });

    // Update session with enhanced data
    const enhancedSession = await prisma.session.update({
      where: { token: sessionToken },
      data: {
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
        lastActivityAt: new Date(),
      },
    });

    console.log(`[Session Enhanced] Session ${session.id} enhanced with tracking data`);

    return enhancedSession;
  } catch (error) {
    console.error("[Session Enhancement] Failed to enhance session:", error);
    return null;
  }
}

/**
 * Enhance all sessions for a user (useful for migration/batch updates)
 */
export async function enhanceUserSessions(userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: { token: true },
    });

    const results = await Promise.allSettled(
      sessions.map((session) => enhanceExistingSession(session.token))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[Session Enhancement] Enhanced ${successful}/${sessions.length} sessions for user ${userId}`);

    return successful;
  } catch (error) {
    console.error("[Session Enhancement] Failed to enhance user sessions:", error);
    return 0;
  }
}

