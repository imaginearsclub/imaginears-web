/**
 * Session Comparison & Analysis
 * 
 * Compare sessions to detect:
 * - Duplicate sessions
 * - Conflicting sessions
 * - Session takeover attempts
 * - Behavioral anomalies
 */

import { prisma } from './prisma';
import { compareFingerprints } from './session-fingerprint';

export interface SessionComparison {
  session1: string;
  session2: string;
  similarity: number; // 0-100
  differences: {
    field: string;
    value1: any;
    value2: any;
    significance: 'low' | 'medium' | 'high';
  }[];
  conflict: boolean;
  conflictType?: 'duplicate' | 'takeover' | 'shared_account' | 'location_mismatch';
  recommendation: string;
}

/**
 * Compare two sessions
 */
export async function compareSessions(sessionId1: string, sessionId2: string): Promise<SessionComparison> {
  const [session1, session2] = await Promise.all([
    prisma.session.findUnique({ where: { id: sessionId1 } }),
    prisma.session.findUnique({ where: { id: sessionId2 } }),
  ]);
  
  if (!session1 || !session2) {
    throw new Error('One or both sessions not found');
  }
  
  const differences: SessionComparison['differences'] = [];
  let similarityScore = 100;
  
  // Compare device info
  if (session1.deviceName !== session2.deviceName) {
    differences.push({
      field: 'Device Name',
      value1: session1.deviceName,
      value2: session2.deviceName,
      significance: 'high',
    });
    similarityScore -= 15;
  }
  
  if (session1.deviceType !== session2.deviceType) {
    differences.push({
      field: 'Device Type',
      value1: session1.deviceType,
      value2: session2.deviceType,
      significance: 'medium',
    });
    similarityScore -= 10;
  }
  
  // Compare location
  if (session1.country !== session2.country) {
    differences.push({
      field: 'Country',
      value1: session1.country,
      value2: session2.country,
      significance: 'high',
    });
    similarityScore -= 20;
  }
  
  if (session1.city !== session2.city) {
    differences.push({
      field: 'City',
      value1: session1.city,
      value2: session2.city,
      significance: 'medium',
    });
    similarityScore -= 10;
  }
  
  // Compare IP
  if (session1.ipAddress !== session2.ipAddress) {
    differences.push({
      field: 'IP Address',
      value1: session1.ipAddress,
      value2: session2.ipAddress,
      significance: 'high',
    });
    similarityScore -= 15;
  }
  
  // Compare browser/OS
  if (session1.browser !== session2.browser) {
    differences.push({
      field: 'Browser',
      value1: session1.browser,
      value2: session2.browser,
      significance: 'medium',
    });
    similarityScore -= 10;
  }
  
  if (session1.os !== session2.os) {
    differences.push({
      field: 'OS',
      value1: session1.os,
      value2: session2.os,
      significance: 'medium',
    });
    similarityScore -= 10;
  }
  
  // Compare trust levels
  if (Math.abs(session1.trustLevel - session2.trustLevel) >= 2) {
    differences.push({
      field: 'Trust Level',
      value1: session1.trustLevel,
      value2: session2.trustLevel,
      significance: 'high',
    });
    similarityScore -= 10;
  }
  
  // Ensure score doesn't go below 0
  similarityScore = Math.max(0, similarityScore);
  
  // Determine if there's a conflict
  let conflict = false;
  let conflictType: SessionComparison['conflictType'];
  let recommendation = 'Sessions appear normal';
  
  // Check for duplicate (very similar)
  if (similarityScore >= 90) {
    conflict = true;
    conflictType = 'duplicate';
    recommendation = 'Sessions are nearly identical - possible duplicate login';
  }
  
  // Check for location mismatch (concurrent from different locations)
  if (
    session1.country !== session2.country &&
    Math.abs(session1.lastActivityAt.getTime() - session2.lastActivityAt.getTime()) < 60 * 60 * 1000
  ) {
    conflict = true;
    conflictType = 'location_mismatch';
    recommendation = 'Concurrent sessions from different countries detected - possible account compromise';
  }
  
  // Check for potential takeover (different device, different location, low trust)
  if (
    session1.deviceName !== session2.deviceName &&
    session1.country !== session2.country &&
    (session1.trustLevel === 0 || session2.trustLevel === 0)
  ) {
    conflict = true;
    conflictType = 'takeover';
    recommendation = 'Suspicious: new device from new location with low trust - verify ownership';
  }
  
  // Check for shared account usage
  if (
    session1.deviceType !== session2.deviceType &&
    session1.city !== session2.city &&
    similarityScore < 50
  ) {
    conflict = true;
    conflictType = 'shared_account';
    recommendation = 'Multiple devices and locations - possible account sharing';
  }
  
  return {
    session1: sessionId1,
    session2: sessionId2,
    similarity: similarityScore,
    differences,
    conflict,
    conflictType,
    recommendation,
  };
}

/**
 * Compare all active sessions for a user
 */
export async function compareAllUserSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
  });
  
  if (sessions.length < 2) {
    return {
      hasConflicts: false,
      comparisons: [],
    };
  }
  
  const comparisons: SessionComparison[] = [];
  
  // Compare each pair of sessions
  for (let i = 0; i < sessions.length - 1; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const comparison = await compareSessions(sessions[i].id, sessions[j].id);
      if (comparison.conflict) {
        comparisons.push(comparison);
      }
    }
  }
  
  return {
    hasConflicts: comparisons.length > 0,
    comparisons,
    totalSessions: sessions.length,
  };
}

/**
 * Detect session takeover attempts
 */
export async function detectSessionTakeover(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const takeovers: Array<{
    suspectedSession: string;
    indicators: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }> = [];
  
  // Get the most trusted session as baseline
  const trustedSession = sessions.reduce((prev, current) => 
    current.trustLevel > prev.trustLevel ? current : prev
  , sessions[0]);
  
  for (const session of sessions) {
    if (session.id === trustedSession.id) continue;
    
    const indicators: string[] = [];
    let severityScore = 0;
    
    // New device from new location
    if (
      session.deviceName !== trustedSession.deviceName &&
      session.country !== trustedSession.country
    ) {
      indicators.push('New device from unfamiliar location');
      severityScore += 30;
    }
    
    // Created recently with low trust
    const hoursSinceCreated = (Date.now() - session.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated < 1 && session.trustLevel === 0) {
      indicators.push('Very recent login with no trust history');
      severityScore += 25;
    }
    
    // Different IP range
    if (
      session.ipAddress &&
      trustedSession.ipAddress &&
      !session.ipAddress.startsWith(trustedSession.ipAddress.split('.')[0])
    ) {
      indicators.push('Completely different IP range');
      severityScore += 20;
    }
    
    // Flagged as suspicious
    if (session.isSuspicious) {
      indicators.push('Flagged by automated security systems');
      severityScore += 30;
    }
    
    // Different time of day
    const sessionHour = session.createdAt.getHours();
    const trustedHour = trustedSession.createdAt.getHours();
    if (Math.abs(sessionHour - trustedHour) > 6) {
      indicators.push('Login at unusual time compared to normal pattern');
      severityScore += 10;
    }
    
    if (indicators.length > 0) {
      let severity: 'low' | 'medium' | 'high' | 'critical';
      if (severityScore >= 70) severity = 'critical';
      else if (severityScore >= 50) severity = 'high';
      else if (severityScore >= 30) severity = 'medium';
      else severity = 'low';
      
      takeovers.push({
        suspectedSession: session.id,
        indicators,
        severity,
        recommendation: severity === 'critical' || severity === 'high'
          ? 'Terminate this session immediately and force password reset'
          : 'Monitor this session closely and verify with user',
      });
    }
  }
  
  return {
    detected: takeovers.length > 0,
    takeovers: takeovers.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }),
  };
}

/**
 * Analyze behavioral patterns
 */
export async function analyzeBehavioralPatterns(userId: string, days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: { gte: cutoff },
    },
    include: {
      activities: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  
  // Analyze patterns
  const patterns = {
    // Time patterns
    loginHours: sessions.map(s => s.createdAt.getHours()),
    typicalLoginHour: 0,
    
    // Device patterns
    devices: new Set(sessions.map(s => s.deviceName).filter(Boolean)),
    primaryDevice: '',
    
    // Location patterns
    locations: new Set(sessions.map(s => `${s.country}-${s.city}`).filter(c => !c.includes('null'))),
    primaryLocation: '',
    
    // Activity patterns
    avgSessionDuration: 0,
    avgActivitiesPerSession: 0,
    
    // Anomalies
    anomalies: [] as string[],
  };
  
  // Calculate typical login hour
  if (patterns.loginHours.length > 0) {
    patterns.typicalLoginHour = Math.round(
      patterns.loginHours.reduce((a, b) => a + b, 0) / patterns.loginHours.length
    );
  }
  
  // Find primary device (most used)
  const deviceCounts = new Map<string, number>();
  sessions.forEach(s => {
    if (s.deviceName) {
      deviceCounts.set(s.deviceName, (deviceCounts.get(s.deviceName) || 0) + 1);
    }
  });
  if (deviceCounts.size > 0) {
    patterns.primaryDevice = Array.from(deviceCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  // Find primary location
  const locationCounts = new Map<string, number>();
  sessions.forEach(s => {
    const loc = `${s.city}, ${s.country}`;
    if (!loc.includes('null')) {
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    }
  });
  if (locationCounts.size > 0) {
    patterns.primaryLocation = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  // Calculate average session duration and activities
  const sessionsWithActivities = sessions.filter(s => 'activities' in s);
  if (sessionsWithActivities.length > 0) {
    patterns.avgActivitiesPerSession = 
      sessionsWithActivities.reduce((acc, s) => acc + (s.activities as any[]).length, 0) / 
      sessionsWithActivities.length;
    
    const durations = sessionsWithActivities.map(s => {
      const activities = s.activities as any[];
      if (activities.length === 0) return 0;
      
      const firstActivity = activities[0].createdAt;
      const lastActivity = activities[activities.length - 1].createdAt;
      return (lastActivity.getTime() - firstActivity.getTime()) / (1000 * 60); // minutes
    });
    
    patterns.avgSessionDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  }
  
  // Detect anomalies
  if (patterns.devices.size > 5) {
    patterns.anomalies.push(`High number of devices: ${patterns.devices.size}`);
  }
  
  if (patterns.locations.size > 3) {
    patterns.anomalies.push(`Multiple locations: ${patterns.locations.size} different locations`);
  }
  
  const recentSessions = sessions.slice(-10);
  const suspiciousRate = recentSessions.filter(s => s.isSuspicious).length / recentSessions.length;
  if (suspiciousRate > 0.3) {
    patterns.anomalies.push(`High suspicious activity rate: ${(suspiciousRate * 100).toFixed(1)}%`);
  }
  
  return {
    ...patterns,
    devices: Array.from(patterns.devices),
    locations: Array.from(patterns.locations),
    totalSessions: sessions.length,
    avgSessionDurationMinutes: Math.round(patterns.avgSessionDuration),
    avgActivitiesPerSession: Math.round(patterns.avgActivitiesPerSession * 10) / 10,
    hasAnomalies: patterns.anomalies.length > 0,
  };
}

/**
 * Find duplicate sessions
 */
export async function findDuplicateSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
  });
  
  const duplicates: Array<{
    sessions: string[];
    reason: string;
  }> = [];
  
  // Group by device + IP
  const groups = new Map<string, typeof sessions>();
  sessions.forEach(session => {
    const key = `${session.deviceName}-${session.ipAddress}`;
    const existing = groups.get(key) || [];
    groups.set(key, [...existing, session]);
  });
  
  // Find groups with multiple sessions
  groups.forEach((groupSessions, key) => {
    if (groupSessions.length > 1) {
      duplicates.push({
        sessions: groupSessions.map(s => s.id),
        reason: `Multiple sessions from same device and IP: ${key}`,
      });
    }
  });
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

