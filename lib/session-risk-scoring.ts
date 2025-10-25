/**
 * Session Risk Scoring System
 * 
 * Calculates risk scores for sessions based on multiple factors:
 * - Device/location anomalies
 * - Behavioral patterns
 * - Temporal anomalies
 * - Failed attempt history
 * - Network indicators (VPN, proxy)
 */

import { prisma } from './prisma';

export interface RiskFactor {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskAssessment {
  totalScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  shouldBlock: boolean;
  shouldRequireStepUp: boolean;
  shouldNotify: boolean;
}

/**
 * Calculate comprehensive risk score for a session
 */
export async function calculateSessionRisk(params: {
  userId: string;
  sessionId?: string;
  ip: string;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  fingerprint?: string;
  isNewDevice: boolean;
  isNewLocation: boolean;
}): Promise<RiskAssessment> {
  const factors: RiskFactor[] = [];
  
  // Get user's session history
  const userSessions = await prisma.session.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  
  // Get recent failed attempts (if tracked)
  const recentActivity = await prisma.sessionActivity.findMany({
    where: {
      session: { userId: params.userId },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Factor 1: New Device Risk
  if (params.isNewDevice) {
    const previousDevices = new Set(userSessions.map(s => s.deviceName));
    const isCompletelyNew = previousDevices.size > 0;
    
    factors.push({
      name: 'New Device',
      score: isCompletelyNew ? 40 : 20,
      weight: 0.15,
      description: isCompletelyNew 
        ? 'First time login from this device' 
        : 'Device recently used',
      severity: isCompletelyNew ? 'medium' : 'low',
    });
  }
  
  // Factor 2: Location Anomaly
  if (params.country) {
    const previousCountries = new Set(userSessions.map(s => s.country).filter(Boolean));
    const isNewCountry = !previousCountries.has(params.country);
    
    if (isNewCountry && previousCountries.size > 0) {
      factors.push({
        name: 'New Country',
        score: 50,
        weight: 0.2,
        description: `First login from ${params.country}`,
        severity: 'high',
      });
    } else if (params.isNewLocation) {
      factors.push({
        name: 'New City',
        score: 30,
        weight: 0.1,
        description: `New city: ${params.city || 'Unknown'}`,
        severity: 'medium',
      });
    }
  }
  
  // Factor 3: Rapid Location Change (Impossible Travel)
  const recentSession = userSessions[0];
  if (recentSession && params.country) {
    const timeSinceLastLogin = Date.now() - recentSession.createdAt.getTime();
    const hoursSince = timeSinceLastLogin / (1000 * 60 * 60);
    
    if (
      recentSession.country && 
      recentSession.country !== params.country && 
      hoursSince < 2
    ) {
      factors.push({
        name: 'Impossible Travel',
        score: 90,
        weight: 0.25,
        description: `Login from ${params.country} ${hoursSince.toFixed(1)}h after login from ${recentSession.country}`,
        severity: 'critical',
      });
    }
  }
  
  // Factor 4: Failed Attempts
  const failedAttempts = recentActivity.filter(a => 
    a.isError && a.action === 'login'
  ).length;
  
  if (failedAttempts > 0) {
    const score = Math.min(failedAttempts * 15, 100);
    factors.push({
      name: 'Failed Login Attempts',
      score,
      weight: 0.15,
      description: `${failedAttempts} failed login attempts in last 24h`,
      severity: failedAttempts >= 3 ? 'high' : 'medium',
    });
  }
  
  // Factor 5: Unusual Time (based on user's typical pattern)
  const currentHour = new Date().getHours();
  const typicalHours = userSessions
    .map(s => new Date(s.createdAt).getHours())
    .slice(0, 20);
  
  if (typicalHours.length > 5) {
    const avgHour = typicalHours.reduce((a, b) => a + b, 0) / typicalHours.length;
    const hourDiff = Math.abs(currentHour - avgHour);
    
    if (hourDiff > 6) {
      factors.push({
        name: 'Unusual Time',
        score: 25,
        weight: 0.05,
        description: `Login at ${currentHour}:00 (typical: ${Math.round(avgHour)}:00)`,
        severity: 'low',
      });
    }
  }
  
  // Factor 6: Suspicious Activity History
  const suspiciousSessions = userSessions.filter(s => s.isSuspicious).length;
  if (suspiciousSessions > 0) {
    factors.push({
      name: 'Suspicious History',
      score: Math.min(suspiciousSessions * 10, 50),
      weight: 0.1,
      description: `${suspiciousSessions} previous suspicious sessions`,
      severity: suspiciousSessions >= 3 ? 'high' : 'medium',
    });
  }
  
  // Factor 7: IP Reputation (placeholder - would integrate with service)
  const isKnownVPN = checkVPNIndicators(params.ip);
  if (isKnownVPN) {
    factors.push({
      name: 'VPN/Proxy Detected',
      score: 35,
      weight: 0.1,
      description: 'Connection through VPN or proxy',
      severity: 'medium',
    });
  }
  
  // Factor 8: Rapid Session Creation
  const recentSessions = userSessions.filter(s => 
    Date.now() - s.createdAt.getTime() < 10 * 60 * 1000 // Last 10 minutes
  );
  
  if (recentSessions.length >= 3) {
    factors.push({
      name: 'Rapid Logins',
      score: 60,
      weight: 0.15,
      description: `${recentSessions.length} logins in last 10 minutes`,
      severity: 'high',
    });
  }
  
  // Calculate weighted total score
  const totalScore = factors.length > 0
    ? factors.reduce((acc, factor) => acc + (factor.score * factor.weight), 0)
    : 0;
  
  // Determine risk level
  let riskLevel: RiskAssessment['riskLevel'];
  if (totalScore >= 70) riskLevel = 'critical';
  else if (totalScore >= 50) riskLevel = 'high';
  else if (totalScore >= 25) riskLevel = 'medium';
  else riskLevel = 'low';
  
  // Generate recommendations
  const recommendations = generateRecommendations(factors, riskLevel);
  
  // Determine actions
  const shouldBlock = totalScore >= 80;
  const shouldRequireStepUp = totalScore >= 60;
  const shouldNotify = totalScore >= 40;
  
  return {
    totalScore: Math.round(totalScore),
    riskLevel,
    factors,
    recommendations,
    shouldBlock,
    shouldRequireStepUp,
    shouldNotify,
  };
}

/**
 * Generate risk-based recommendations
 */
function generateRecommendations(
  factors: RiskFactor[],
  riskLevel: RiskAssessment['riskLevel']
): string[] {
  const recommendations: string[] = [];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push('Require immediate password change');
    recommendations.push('Enable two-factor authentication');
    recommendations.push('Review all active sessions');
  }
  
  if (factors.some(f => f.name === 'Impossible Travel')) {
    recommendations.push('Verify this login was legitimate');
    recommendations.push('Consider blocking logins from unusual locations');
  }
  
  if (factors.some(f => f.name === 'Failed Login Attempts')) {
    recommendations.push('Check for credential stuffing attempts');
    recommendations.push('Consider implementing CAPTCHA');
  }
  
  if (factors.some(f => f.name === 'VPN/Proxy Detected')) {
    recommendations.push('Verify user identity through additional means');
    recommendations.push('Consider restricting VPN access');
  }
  
  if (factors.some(f => f.name === 'New Device')) {
    recommendations.push('Send email verification for new device');
    recommendations.push('Require device approval');
  }
  
  if (riskLevel === 'medium') {
    recommendations.push('Monitor session activity closely');
    recommendations.push('Log detailed audit trail');
  }
  
  return recommendations;
}

/**
 * Check for VPN/Proxy indicators (simplified)
 */
function checkVPNIndicators(ip: string): boolean {
  // In production, integrate with VPN detection service:
  // - IPHub
  // - IPQualityScore
  // - MaxMind minFraud
  // - IP2Proxy
  
  // Simplified check for common VPN/proxy patterns
  const vpnPatterns = [
    /^10\./, // Private network
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private network
    /^192\.168\./, // Private network
  ];
  
  return vpnPatterns.some(pattern => pattern.test(ip));
}

/**
 * Get risk history for user
 */
export async function getUserRiskHistory(userId: string, days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: { gte: cutoff },
    },
    include: {
      activities: {
        where: {
          isSuspicious: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Calculate risk for each session
  const riskHistory = await Promise.all(
    sessions.map(async (session) => {
      const risk = await calculateSessionRisk({
        userId,
        sessionId: session.id,
        ip: session.ipAddress || '',
        country: session.country,
        city: session.city,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        browser: session.browser,
        isNewDevice: false, // Retroactive analysis
        isNewLocation: false,
      });
      
      return {
        session,
        risk,
      };
    })
  );
  
  return riskHistory;
}

/**
 * Get aggregate risk statistics
 */
export async function getRiskStatistics(userId: string) {
  const history = await getUserRiskHistory(userId, 30);
  
  const riskLevels = {
    low: history.filter(h => h.risk.riskLevel === 'low').length,
    medium: history.filter(h => h.risk.riskLevel === 'medium').length,
    high: history.filter(h => h.risk.riskLevel === 'high').length,
    critical: history.filter(h => h.risk.riskLevel === 'critical').length,
  };
  
  const avgRiskScore = history.length > 0
    ? history.reduce((acc, h) => acc + h.risk.totalScore, 0) / history.length
    : 0;
  
  const topRiskFactors = history
    .flatMap(h => h.risk.factors)
    .reduce((acc, factor) => {
      acc[factor.name] = (acc[factor.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  return {
    totalSessions: history.length,
    riskLevels,
    avgRiskScore: Math.round(avgRiskScore),
    topRiskFactors: Object.entries(topRiskFactors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
    recentHighRisk: history
      .filter(h => h.risk.riskLevel === 'high' || h.risk.riskLevel === 'critical')
      .slice(0, 10),
  };
}

/**
 * Auto-block high risk sessions
 */
export async function autoBlockHighRiskSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
      isSuspicious: true,
    },
  });
  
  const blockedSessions: string[] = [];
  
  for (const session of sessions) {
    const risk = await calculateSessionRisk({
      userId,
      sessionId: session.id,
      ip: session.ipAddress || '',
      country: session.country,
      city: session.city,
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      browser: session.browser,
      isNewDevice: false,
      isNewLocation: false,
    });
    
    if (risk.shouldBlock) {
      await prisma.session.delete({ where: { id: session.id } });
      blockedSessions.push(session.id);
      
      console.log(`[Risk] Auto-blocked session ${session.id} (score: ${risk.totalScore})`);
    }
  }
  
  return {
    blocked: blockedSessions.length,
    sessionIds: blockedSessions,
  };
}

