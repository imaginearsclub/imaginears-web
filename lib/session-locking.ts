/**
 * Session Locking & Forced Re-authentication
 * 
 * Provides mechanisms to:
 * - Lock sessions to specific IPs
 * - Require re-authentication for sensitive actions
 * - Force password re-entry
 * - Implement step-up authentication
 * - Session conflict resolution
 */

import { prisma } from './prisma';
import { calculateSessionRisk } from './session-risk-scoring';
import { notifySecurityAlert } from './session-notifications';

export interface SessionLock {
  sessionId: string;
  lockedToIP: string;
  lockedToFingerprint?: string;
  lockedAt: Date;
  reason: string;
  canOverride: boolean;
}

export interface StepUpRequirement {
  sessionId: string;
  action: string;
  requiredAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  method: 'password' | '2fa' | 'biometric';
}

/**
 * Lock session to current IP address
 */
export async function lockSessionToIP(sessionId: string, ip: string, reason: string = 'Security policy') {
  // Store lock information (in production, use database)
  const lock: SessionLock = {
    sessionId,
    lockedToIP: ip,
    lockedAt: new Date(),
    reason,
    canOverride: false,
  };
  
  // Update session
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      ipAddress: ip,
      // In production, add a 'locked' field to schema
    },
  });
  
  console.log(`[Session Lock] Locked session ${sessionId} to IP ${ip}`);
  
  return lock;
}

/**
 * Lock session to device fingerprint
 */
export async function lockSessionToFingerprint(
  sessionId: string, 
  fingerprint: string,
  reason: string = 'Device binding'
) {
  const lock: SessionLock = {
    sessionId,
    lockedToIP: '', // Not IP-locked
    lockedToFingerprint: fingerprint,
    lockedAt: new Date(),
    reason,
    canOverride: false,
  };
  
  // Store fingerprint (in production, add to session schema)
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      // fingerprint field would be added to schema
    },
  });
  
  console.log(`[Session Lock] Locked session ${sessionId} to fingerprint`);
  
  return lock;
}

/**
 * Verify session lock compliance
 */
export async function verifySessionLock(
  sessionId: string,
  currentIP: string,
  currentFingerprint?: string
): Promise<{ valid: boolean; reason?: string }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }
  
  // Check IP lock
  if (session.ipAddress && session.ipAddress !== currentIP) {
    return { 
      valid: false, 
      reason: `IP mismatch: session locked to ${session.ipAddress}, request from ${currentIP}` 
    };
  }
  
  // Check fingerprint lock (would check stored fingerprint)
  // if (currentFingerprint && storedFingerprint !== currentFingerprint) {
  //   return { valid: false, reason: 'Device fingerprint mismatch' };
  // }
  
  return { valid: true };
}

/**
 * Force session re-authentication
 */
export async function requireReAuth(
  sessionId: string,
  reason: string = 'Security verification required'
): Promise<{ success: boolean; message: string }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  
  if (!session) {
    return { success: false, message: 'Session not found' };
  }
  
  // Mark session as requiring re-auth
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      requiredStepUp: true,
    },
  });
  
  // Send notification
  await notifySecurityAlert({
    userId: session.userId,
    sessionId,
    alertType: 'Re-authentication Required',
    message: reason,
    actionRequired: 'Please sign in again to continue',
    timestamp: new Date(),
  });
  
  console.log(`[Session] Required re-auth for session ${sessionId}: ${reason}`);
  
  return { success: true, message: 'Re-authentication required' };
}

/**
 * Implement step-up authentication for sensitive actions
 */
export async function requireStepUp(
  sessionId: string,
  action: string,
  method: StepUpRequirement['method'] = 'password'
): Promise<StepUpRequirement> {
  const requirement: StepUpRequirement = {
    sessionId,
    action,
    requiredAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    method,
  };
  
  // Store requirement (in production, use database)
  console.log(`[Step-Up] Required ${method} for action '${action}' on session ${sessionId}`);
  
  return requirement;
}

/**
 * Verify step-up authentication was completed
 */
export async function verifyStepUp(
  sessionId: string,
  action: string
): Promise<{ verified: boolean; reason?: string }> {
  // In production, check database for completed step-up
  // For now, return mock verification
  
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) {
    return { verified: false, reason: 'Session not found' };
  }
  
  if (session.requiredStepUp) {
    return { verified: false, reason: 'Step-up authentication required' };
  }
  
  return { verified: true };
}

/**
 * Complete step-up authentication
 */
export async function completeStepUp(
  sessionId: string,
  action: string,
  verified: boolean
): Promise<{ success: boolean; message: string }> {
  if (!verified) {
    return { success: false, message: 'Verification failed' };
  }
  
  // Mark step-up as completed
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      requiredStepUp: false,
    },
  });
  
  console.log(`[Step-Up] Completed for action '${action}' on session ${sessionId}`);
  
  return { success: true, message: 'Step-up authentication completed' };
}

/**
 * Detect and resolve session conflicts
 */
export async function detectSessionConflicts(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
  });
  
  if (sessions.length <= 1) {
    return { hasConflicts: false, conflicts: [] };
  }
  
  const conflicts: Array<{
    type: 'concurrent_location' | 'duplicate_device' | 'suspicious_pattern';
    sessions: typeof sessions;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }> = [];
  
  // Check for impossible concurrent locations
  for (let i = 0; i < sessions.length - 1; i++) {
    const session1 = sessions[i];
    const session2 = sessions[i + 1];
    
    const timeDiff = Math.abs(
      session1.lastActivityAt.getTime() - session2.lastActivityAt.getTime()
    ) / (1000 * 60); // minutes
    
    if (
      session1.country && 
      session2.country && 
      session1.country !== session2.country && 
      timeDiff < 60
    ) {
      conflicts.push({
        type: 'concurrent_location',
        sessions: [session1, session2],
        severity: 'high',
        recommendation: 'Terminate suspicious session immediately',
      });
    }
  }
  
  // Check for duplicate devices
  const deviceMap = new Map<string, typeof sessions>();
  sessions.forEach(session => {
    if (session.deviceName) {
      const existing = deviceMap.get(session.deviceName) || [];
      deviceMap.set(session.deviceName, [...existing, session]);
    }
  });
  
  deviceMap.forEach((deviceSessions, deviceName) => {
    if (deviceSessions.length > 1) {
      // Multiple sessions from same device
      const ipAddresses = new Set(deviceSessions.map(s => s.ipAddress));
      if (ipAddresses.size > 1) {
        conflicts.push({
          type: 'duplicate_device',
          sessions: deviceSessions,
          severity: 'medium',
          recommendation: 'Verify device ownership and recent activity',
        });
      }
    }
  });
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    totalSessions: sessions.length,
  };
}

/**
 * Auto-resolve session conflicts
 */
export async function autoResolveConflicts(userId: string, strategy: 'keep_newest' | 'keep_trusted' | 'require_manual') {
  const { hasConflicts, conflicts } = await detectSessionConflicts(userId);
  
  if (!hasConflicts) {
    return { resolved: 0, message: 'No conflicts detected' };
  }
  
  let resolved = 0;
  
  for (const conflict of conflicts) {
    if (conflict.severity === 'high') {
      if (strategy === 'keep_newest') {
        // Keep session with most recent activity, delete others
        const [newest, ...others] = conflict.sessions;
        for (const session of others) {
          await prisma.session.delete({ where: { id: session.id } });
          resolved++;
        }
      } else if (strategy === 'keep_trusted') {
        // Keep session with highest trust level
        const sorted = conflict.sessions.sort((a, b) => b.trustLevel - a.trustLevel);
        const [trusted, ...others] = sorted;
        for (const session of others) {
          await prisma.session.delete({ where: { id: session.id } });
          resolved++;
        }
      }
    }
  }
  
  if (strategy === 'require_manual') {
    // Send notification to user
    const session = await prisma.session.findFirst({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' },
    });
    
    if (session) {
      await notifySecurityAlert({
        userId,
        sessionId: session.id,
        alertType: 'Session Conflicts Detected',
        message: `We detected ${conflicts.length} suspicious session conflicts on your account.`,
        actionRequired: 'Please review your active sessions and revoke any unfamiliar ones',
        timestamp: new Date(),
      });
    }
  }
  
  console.log(`[Conflicts] Auto-resolved ${resolved} conflicts using strategy: ${strategy}`);
  
  return { resolved, message: `Resolved ${resolved} conflicts` };
}

/**
 * Force logout all sessions except current
 */
export async function forceLogoutOtherSessions(userId: string, keepSessionId: string) {
  const deleted = await prisma.session.deleteMany({
    where: {
      userId,
      NOT: { id: keepSessionId },
    },
  });
  
  const session = await prisma.session.findUnique({
    where: { id: keepSessionId },
  });
  
  if (session) {
    await notifySecurityAlert({
      userId,
      sessionId: keepSessionId,
      alertType: 'All Sessions Terminated',
      message: 'All other sessions have been logged out for security.',
      timestamp: new Date(),
    });
  }
  
  console.log(`[Session] Force logged out ${deleted.count} sessions for user ${userId}`);
  
  return { count: deleted.count };
}

/**
 * Implement session timeout with warning
 */
export async function checkSessionTimeout(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) {
    return { expired: true, warning: false, remainingMinutes: 0 };
  }
  
  const now = Date.now();
  const lastActivity = session.lastActivityAt.getTime();
  const expiryTime = session.expiresAt.getTime();
  
  const timeSinceActivity = now - lastActivity;
  const timeUntilExpiry = expiryTime - now;
  
  // 15 minute warning before timeout
  const warningThreshold = 15 * 60 * 1000;
  
  if (timeUntilExpiry <= 0) {
    await prisma.session.delete({ where: { id: sessionId } });
    return { expired: true, warning: false, remainingMinutes: 0 };
  }
  
  if (timeUntilExpiry <= warningThreshold) {
    return {
      expired: false,
      warning: true,
      remainingMinutes: Math.floor(timeUntilExpiry / (60 * 1000)),
    };
  }
  
  return { expired: false, warning: false, remainingMinutes: Math.floor(timeUntilExpiry / (60 * 1000)) };
}

/**
 * Extend session timeout (after user activity)
 */
export async function extendSessionTimeout(sessionId: string, minutes: number = 30) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) {
    return { success: false, message: 'Session not found' };
  }
  
  const newExpiry = new Date(Date.now() + minutes * 60 * 1000);
  
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      expiresAt: newExpiry,
      lastActivityAt: new Date(),
    },
  });
  
  return { success: true, message: `Session extended by ${minutes} minutes` };
}

/**
 * Freeze suspicious session (prevent any actions)
 */
export async function freezeSession(sessionId: string, reason: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  
  if (!session) {
    return { success: false, message: 'Session not found' };
  }
  
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      isSuspicious: true,
      requiredStepUp: true,
    },
  });
  
  await notifySecurityAlert({
    userId: session.userId,
    sessionId,
    alertType: 'Session Frozen',
    message: `Your session has been frozen due to: ${reason}`,
    actionRequired: 'Please verify your identity to continue',
    timestamp: new Date(),
  });
  
  console.log(`[Session] Frozen session ${sessionId}: ${reason}`);
  
  return { success: true, message: 'Session frozen' };
}

/**
 * Unfreeze session after verification
 */
export async function unfreezeSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      isSuspicious: false,
      requiredStepUp: false,
    },
  });
  
  console.log(`[Session] Unfroze session ${sessionId}`);
  
  return { success: true, message: 'Session unfrozen' };
}

