/**
 * Real-time Session Monitoring
 * 
 * Provides real-time updates for:
 * - Active sessions
 * - New login events
 * - Suspicious activity
 * - Session terminations
 * 
 * Can be integrated with WebSocket or Server-Sent Events (SSE)
 */

import { prisma } from './prisma';

export interface SessionEvent {
  type: 'session_created' | 'session_updated' | 'session_terminated' | 'activity_detected' | 'security_alert';
  timestamp: Date;
  sessionId: string;
  userId: string;
  data: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
}

// In-memory event queue (in production, use Redis or similar)
const eventQueue = new Map<string, SessionEvent[]>();

/**
 * Emit a session event
 */
export function emitSessionEvent(event: SessionEvent) {
  const userEvents = eventQueue.get(event.userId) || [];
  userEvents.push(event);
  
  // Keep only last 100 events per user
  if (userEvents.length > 100) {
    userEvents.shift();
  }
  
  eventQueue.set(event.userId, userEvents);
  
  console.log(`[Session Event] ${event.type} for user ${event.userId}`);
  
  // In production, broadcast via WebSocket or SSE
  // broadcastToUser(event.userId, event);
}

/**
 * Get events for a user
 */
export function getUserEvents(userId: string, limit: number = 50): SessionEvent[] {
  const events = eventQueue.get(userId) || [];
  return events.slice(-limit);
}

/**
 * Clear events for a user
 */
export function clearUserEvents(userId: string) {
  eventQueue.delete(userId);
}

/**
 * Monitor session creation
 */
export async function monitorSessionCreation(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });
  
  if (!session) return;
  
  emitSessionEvent({
    type: 'session_created',
    timestamp: new Date(),
    sessionId,
    userId: session.userId,
    data: {
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      location: `${session.city}, ${session.country}`,
      ip: session.ipAddress,
      trustLevel: session.trustLevel,
      isSuspicious: session.isSuspicious,
    },
    severity: session.isSuspicious ? 'warning' : 'info',
  });
}

/**
 * Monitor session activity
 */
export async function monitorSessionActivity(sessionId: string, action: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) return;
  
  emitSessionEvent({
    type: 'activity_detected',
    timestamp: new Date(),
    sessionId,
    userId: session.userId,
    data: {
      action,
      deviceName: session.deviceName,
      location: `${session.city}, ${session.country}`,
    },
    severity: 'info',
  });
}

/**
 * Monitor session termination
 */
export async function monitorSessionTermination(sessionId: string, reason: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  
  if (!session) return;
  
  emitSessionEvent({
    type: 'session_terminated',
    timestamp: new Date(),
    sessionId,
    userId: session.userId,
    data: {
      reason,
      deviceName: session.deviceName,
      location: `${session.city}, ${session.country}`,
    },
    severity: reason.includes('suspicious') ? 'warning' : 'info',
  });
}

/**
 * Monitor security alerts
 */
export function monitorSecurityAlert(userId: string, sessionId: string, alertType: string, details: string) {
  emitSessionEvent({
    type: 'security_alert',
    timestamp: new Date(),
    sessionId,
    userId,
    data: {
      alertType,
      details,
    },
    severity: 'critical',
  });
}

/**
 * Get real-time session statistics
 */
export async function getRealtimeStats(userId: string) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const [activeSessions, recentActivity, suspiciousSessions] = await Promise.all([
    prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: now },
      },
    }),
    prisma.sessionActivity.count({
      where: {
        session: { userId },
        createdAt: { gte: oneHourAgo },
      },
    }),
    prisma.session.count({
      where: {
        userId,
        isSuspicious: true,
        expiresAt: { gt: now },
      },
    }),
  ]);
  
  return {
    activeSessions,
    recentActivity,
    suspiciousSessions,
    timestamp: new Date(),
  };
}

/**
 * Track concurrent sessions in real-time
 */
export async function trackConcurrentSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      deviceName: true,
      country: true,
      city: true,
      lastActivityAt: true,
    },
    orderBy: { lastActivityAt: 'desc' },
  });
  
  return {
    count: sessions.length,
    sessions: sessions.map(s => ({
      id: s.id,
      device: s.deviceName,
      location: `${s.city}, ${s.country}`,
      lastSeen: s.lastActivityAt,
      isActive: (new Date().getTime() - s.lastActivityAt.getTime()) < 5 * 60 * 1000, // Active in last 5 min
    })),
  };
}

/**
 * Detect anomalies in real-time
 */
export async function detectRealTimeAnomalies(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
  });
  
  const anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    sessions: string[];
  }> = [];
  
  // Check for concurrent sessions from different countries
  const countries = new Set(sessions.map(s => s.country).filter(Boolean));
  if (countries.size > 2) {
    anomalies.push({
      type: 'Multiple Countries',
      severity: 'high',
      description: `Active sessions detected from ${countries.size} different countries simultaneously`,
      sessions: sessions.map(s => s.id),
    });
  }
  
  // Check for rapid session creation
  const recentSessions = sessions.filter(s => 
    new Date().getTime() - s.createdAt.getTime() < 10 * 60 * 1000
  );
  if (recentSessions.length >= 3) {
    anomalies.push({
      type: 'Rapid Login',
      severity: 'high',
      description: `${recentSessions.length} sessions created in last 10 minutes`,
      sessions: recentSessions.map(s => s.id),
    });
  }
  
  // Check for suspicious sessions
  const suspicious = sessions.filter(s => s.isSuspicious);
  if (suspicious.length > 0) {
    anomalies.push({
      type: 'Suspicious Activity',
      severity: 'medium',
      description: `${suspicious.length} sessions flagged as suspicious`,
      sessions: suspicious.map(s => s.id),
    });
  }
  
  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
    timestamp: new Date(),
  };
}

/**
 * Generate session timeline for visualization
 */
export async function generateSessionTimeline(userId: string, days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: { gte: cutoff },
    },
    include: {
      activities: {
        select: {
          id: true,
          action: true,
          createdAt: true,
          isError: true,
          isSuspicious: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
  
  // Group by date
  const timeline: Record<string, {
    date: string;
    logins: number;
    activities: number;
    errors: number;
    suspicious: number;
    devices: Set<string>;
    locations: Set<string>;
  }> = {};
  
  sessions.forEach(session => {
    const dateKey = session.createdAt.toISOString().split('T')[0];
    
    if (!timeline[dateKey]) {
      timeline[dateKey] = {
        date: dateKey,
        logins: 0,
        activities: 0,
        errors: 0,
        suspicious: 0,
        devices: new Set(),
        locations: new Set(),
      };
    }
    
    const entry = timeline[dateKey];
    entry.logins++;
    
    if (session.deviceName) entry.devices.add(session.deviceName);
    if (session.country && session.city) {
      entry.locations.add(`${session.city}, ${session.country}`);
    }
    
    if ('activities' in session) {
      const activities = session.activities as any[];
      entry.activities += activities.length;
      entry.errors += activities.filter(a => a.isError).length;
      entry.suspicious += activities.filter(a => a.isSuspicious).length;
    }
  });
  
  // Convert sets to arrays and counts
  return Object.values(timeline).map(entry => ({
    ...entry,
    devices: Array.from(entry.devices),
    deviceCount: entry.devices.size,
    locations: Array.from(entry.locations),
    locationCount: entry.locations.size,
  }));
}

/**
 * Stream session events (for SSE/WebSocket)
 */
export async function* streamSessionEvents(userId: string) {
  // This is a generator function for streaming events
  // In production, integrate with Redis pub/sub or similar
  
  let lastCheck = Date.now();
  
  while (true) {
    // Check for new events
    const events = getUserEvents(userId);
    const newEvents = events.filter(e => e.timestamp.getTime() > lastCheck);
    
    for (const event of newEvents) {
      yield event;
    }
    
    lastCheck = Date.now();
    
    // Wait 1 second before next check
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Session health check
 */
export async function checkSessionHealth(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      activities: {
        where: {
          createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  
  if (!session) {
    return {
      healthy: false,
      reason: 'Session not found',
    };
  }
  
  // Check if expired
  if (session.expiresAt < new Date()) {
    return {
      healthy: false,
      reason: 'Session expired',
    };
  }
  
  // Check if inactive
  const inactiveMinutes = (Date.now() - session.lastActivityAt.getTime()) / (1000 * 60);
  if (inactiveMinutes > 30) {
    return {
      healthy: false,
      reason: `Inactive for ${Math.round(inactiveMinutes)} minutes`,
      warning: true,
    };
  }
  
  // Check for errors
  const activities = (session.activities as any[]) || [];
  const errorRate = activities.length > 0
    ? activities.filter(a => a.isError).length / activities.length
    : 0;
  
  if (errorRate > 0.5) {
    return {
      healthy: false,
      reason: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      warning: true,
    };
  }
  
  return {
    healthy: true,
    inactiveMinutes: Math.round(inactiveMinutes),
    recentActivity: activities.length,
    errorRate: (errorRate * 100).toFixed(1) + '%',
  };
}

