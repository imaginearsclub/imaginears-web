/**
 * Session Policy Management
 * 
 * Provides fine-grained control over session access:
 * - IP allowlisting/blocklisting
 * - Geographic restrictions
 * - Time-based access controls
 * - Device type restrictions
 * - Concurrent session limits per user
 */

import { prisma } from './prisma';
import IPCIDR from 'ip-cidr';
import { log } from './logger';

export interface SessionPolicy {
  id: string;
  userId: string;
  
  // IP Restrictions
  allowedIPs: string[]; // CIDR notation supported
  blockedIPs: string[];
  
  // Geographic Restrictions
  allowedCountries: string[]; // ISO country codes
  blockedCountries: string[];
  
  // Time-based Access
  allowedDays: number[]; // 0-6 (Sunday-Saturday)
  allowedTimeStart: string; // HH:MM format
  allowedTimeEnd: string; // HH:MM format
  timezone: string; // IANA timezone
  
  // Device Restrictions
  allowedDeviceTypes: string[]; // mobile, tablet, desktop
  blockedDeviceTypes: string[];
  
  // Session Limits
  maxConcurrentSessions: number;
  requireFingerprintMatch: boolean;
  
  // Security
  requireStepUpForSensitiveActions: boolean;
  autoLogoutOnLocationChange: boolean;
  autoLogoutOnIPChange: boolean;
  
  // Notifications
  notifyOnNewDevice: boolean;
  notifyOnNewLocation: boolean;
  notifyOnSuspiciousActivity: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get session policy for a user
 */
export async function getUserSessionPolicy(userId: string): Promise<SessionPolicy | null> {
  try {
    // For now, we'll use a default policy
    // In the future, store in database
    return getDefaultPolicy(userId);
  } catch (error) {
    log.error('Session Policy: Error fetching policy', { userId, error });
    return null;
  }
}

/**
 * Get default session policy
 */
export function getDefaultPolicy(userId: string): SessionPolicy {
  return {
    id: `policy_${userId}`,
    userId,
    allowedIPs: [],
    blockedIPs: [],
    allowedCountries: [],
    blockedCountries: [],
    allowedDays: [0, 1, 2, 3, 4, 5, 6], // All days
    allowedTimeStart: '00:00',
    allowedTimeEnd: '23:59',
    timezone: 'America/New_York',
    allowedDeviceTypes: ['mobile', 'tablet', 'desktop'],
    blockedDeviceTypes: [],
    maxConcurrentSessions: 5,
    requireFingerprintMatch: false,
    requireStepUpForSensitiveActions: false,
    autoLogoutOnLocationChange: false,
    autoLogoutOnIPChange: false,
    notifyOnNewDevice: true,
    notifyOnNewLocation: true,
    notifyOnSuspiciousActivity: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Check if IP address is allowed by policy
 */
export function isIPAllowed(ip: string, policy: SessionPolicy): boolean {
  // If no restrictions, allow all
  if (policy.allowedIPs.length === 0 && policy.blockedIPs.length === 0) {
    return true;
  }
  
  // Check blocklist first
  if (policy.blockedIPs.includes(ip)) {
    return false;
  }
  
  // If allowlist exists, IP must be in it
  if (policy.allowedIPs.length > 0) {
    return policy.allowedIPs.includes(ip) || matchCIDR(ip, policy.allowedIPs);
  }
  
  return true;
}

/**
 * Check if country is allowed by policy
 */
export function isCountryAllowed(country: string | null, policy: SessionPolicy): boolean {
  if (!country) return true; // Allow if country unknown
  
  // If no restrictions, allow all
  if (policy.allowedCountries.length === 0 && policy.blockedCountries.length === 0) {
    return true;
  }
  
  // Check blocklist first
  if (policy.blockedCountries.includes(country)) {
    return false;
  }
  
  // If allowlist exists, country must be in it
  if (policy.allowedCountries.length > 0) {
    return policy.allowedCountries.includes(country);
  }
  
  return true;
}

/**
 * Check if current time is within allowed time window
 */
export function isTimeAllowed(policy: SessionPolicy): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: policy.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  
  const parts = formatter.formatToParts(now);
  const timeStr = `${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}`;
  const weekday = now.getDay();
  
  // Check day of week
  if (!policy.allowedDays.includes(weekday)) {
    return false;
  }
  
  // Check time window
  if (policy.allowedTimeStart === '00:00' && policy.allowedTimeEnd === '23:59') {
    return true; // 24/7 access
  }
  
  const [currentHour = 0, currentMinute = 0] = timeStr.split(':').map(Number);
  const [startHour = 0, startMinute = 0] = policy.allowedTimeStart.split(':').map(Number);
  const [endHour = 23, endMinute = 59] = policy.allowedTimeEnd.split(':').map(Number);
  
  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Handle overnight windows (e.g., 22:00 to 06:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Check if device type is allowed by policy
 */
export function isDeviceTypeAllowed(deviceType: string | null, policy: SessionPolicy): boolean {
  if (!deviceType) return true; // Allow if device type unknown
  
  // Check blocklist first
  if (policy.blockedDeviceTypes.includes(deviceType)) {
    return false;
  }
  
  // Check allowlist
  if (policy.allowedDeviceTypes.length > 0) {
    return policy.allowedDeviceTypes.includes(deviceType);
  }
  
  return true;
}

/**
 * Validate session against policy
 */
export interface PolicyValidation {
  allowed: boolean;
  reasons: string[];
  requiresStepUp: boolean;
  shouldLogout: boolean;
  shouldNotify: boolean;
  notificationReason?: string;
}

/**
 * Check notification requirements
 */
function checkNotifications(
  policy: SessionPolicy,
  sessionData: { isNewDevice: boolean; isNewLocation: boolean }
): { shouldNotify: boolean; notificationReason?: string } {
  if (policy.notifyOnNewDevice && sessionData.isNewDevice) {
    return { shouldNotify: true, notificationReason: 'New device detected' };
  }
  
  if (policy.notifyOnNewLocation && sessionData.isNewLocation) {
    return { shouldNotify: true, notificationReason: 'New location detected' };
  }
  
  return { shouldNotify: false };
}

export async function validateSessionPolicy(
  userId: string,
  sessionData: {
    ip: string;
    country: string | null;
    deviceType: string | null;
    isNewDevice: boolean;
    isNewLocation: boolean;
    ipChanged: boolean;
    locationChanged: boolean;
    isSensitiveAction: boolean;
  }
): Promise<PolicyValidation> {
  const policy = await getUserSessionPolicy(userId);
  
  if (!policy) {
    return {
      allowed: true,
      reasons: [],
      requiresStepUp: false,
      shouldLogout: false,
      shouldNotify: false,
    };
  }
  
  const reasons: string[] = [];
  let allowed = true;
  let requiresStepUp = false;
  let shouldLogout = false;
  
  // Check IP restrictions
  if (!isIPAllowed(sessionData.ip, policy)) {
    allowed = false;
    reasons.push('IP address not allowed');
  }
  
  // Check country restrictions
  if (!isCountryAllowed(sessionData.country, policy)) {
    allowed = false;
    reasons.push('Country not allowed');
  }
  
  // Check time restrictions
  if (!isTimeAllowed(policy)) {
    allowed = false;
    reasons.push('Access outside allowed time window');
  }
  
  // Check device type restrictions
  if (!isDeviceTypeAllowed(sessionData.deviceType, policy)) {
    allowed = false;
    reasons.push('Device type not allowed');
  }
  
  // Check if sensitive action requires step-up
  if (sessionData.isSensitiveAction && policy.requireStepUpForSensitiveActions) {
    requiresStepUp = true;
  }
  
  // Check if should auto-logout
  if (policy.autoLogoutOnLocationChange && sessionData.locationChanged) {
    shouldLogout = true;
    reasons.push('Location changed - auto logout');
  }
  
  if (policy.autoLogoutOnIPChange && sessionData.ipChanged) {
    shouldLogout = true;
    reasons.push('IP address changed - auto logout');
  }
  
  // Check notification requirements
  const notifications = checkNotifications(policy, sessionData);
  
  return {
    allowed,
    reasons,
    requiresStepUp,
    shouldLogout,
    ...notifications,
  };
}

/**
 * Check if IP matches any CIDR range
 * Uses ip-cidr library for proper CIDR matching
 */
function matchCIDR(ip: string, cidrs: string[]): boolean {
  try {
    for (const cidr of cidrs) {
      if (cidr.includes('/')) {
        const ipcidr = new IPCIDR(cidr);
        if (ipcidr.contains(ip)) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    log.error('Session Policy: CIDR match error', { ip, cidrs, error });
    return false;
  }
}

/**
 * Update user session policy
 */
export async function updateSessionPolicy(
  userId: string,
  updates: Partial<Omit<SessionPolicy, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<SessionPolicy> {
  // In production, store in database
  // For now, return updated default policy
  const policy = await getUserSessionPolicy(userId);
  
  if (!policy) {
    throw new Error('Policy not found');
  }
  
  return {
    ...policy,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Get session policy violations for user
 */
export async function getSessionPolicyViolations(userId: string, days: number = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  // Query sessions with policy violations
  const violations = await prisma.sessionActivity.findMany({
    where: {
      session: {
        userId,
      },
      isSuspicious: true,
      createdAt: {
        gte: cutoff,
      },
    },
    include: {
      session: {
        select: {
          deviceName: true,
          country: true,
          city: true,
          ipAddress: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
  
  return violations;
}

