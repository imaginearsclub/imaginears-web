/**
 * Session Management Utilities
 * 
 * Provides comprehensive session tracking, device detection,
 * IP geolocation, and security monitoring.
 */

import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

// ========== DEVICE DETECTION ==========

export interface DeviceInfo {
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceName: string; // Auto-generated friendly name
}

/**
 * Parse user agent string to extract device information
 */
export async function parseUserAgent(userAgent: string | null): Promise<DeviceInfo> {
  if (!userAgent) {
    return {
      deviceType: "unknown",
      browser: "Unknown",
      browserVersion: "",
      os: "Unknown",
      osVersion: "",
      deviceName: "Unknown Device",
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Determine device type
  let deviceType: DeviceInfo["deviceType"] = "desktop";
  if (result.device.type === "mobile") deviceType = "mobile";
  else if (result.device.type === "tablet") deviceType = "tablet";
  else if (result.device.type) deviceType = result.device.type as any;

  // Extract info
  const browser = result.browser.name || "Unknown Browser";
  const browserVersion = result.browser.version || "";
  const os = result.os.name || "Unknown OS";
  const osVersion = result.os.version || "";
  const model = result.device.model || "";
  const vendor = result.device.vendor || "";

  // Generate friendly device name
  let deviceName = "";
  if (vendor && model) {
    deviceName = `${vendor} ${model}`;
  } else if (model) {
    deviceName = model;
  } else {
    deviceName = `${os} ${deviceType}`;
  }

  // Clean up device name
  deviceName = deviceName.trim();
  if (!deviceName || deviceName === "Unknown unknown") {
    deviceName = `${browser} on ${os}`;
  }

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceName,
  };
}

/**
 * Get device info from current request headers
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  return parseUserAgent(userAgent);
}

// ========== IP & LOCATION TRACKING ==========

export interface LocationInfo {
  ip: string;
  country: string | null;
  city: string | null;
  region: string | null;
  timezone: string | null;
  isp: string | null;
}

/**
 * Extract IP address from request headers
 * Handles various proxy headers (Cloudflare, Vercel, etc.)
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  
  // Check various headers in order of preference
  const forwardedFor = headersList.get("x-forwarded-for");
  const forwardedForParsed = forwardedFor ? forwardedFor.split(",")[0]?.trim() : null;
  
  const ip = 
    headersList.get("cf-connecting-ip") || // Cloudflare
    headersList.get("x-real-ip") ||
    forwardedForParsed ||
    headersList.get("x-client-ip") ||
    "unknown";
  
  return ip;
}

/**
 * Get location info from IP address
 * Uses ip-api.com (free, no API key required)
 * 
 * Note: For production, consider using a paid service like:
 * - MaxMind GeoIP2
 * - ipstack
 * - IPinfo
 */
export async function getLocationFromIP(ip: string): Promise<LocationInfo> {
  const defaultLocation: LocationInfo = {
    ip,
    country: null,
    city: null,
    region: null,
    timezone: null,
    isp: null,
  };

  // Skip for local/private IPs
  if (
    ip === "unknown" ||
    ip.startsWith("127.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip === "::1"
  ) {
    return { ...defaultLocation, country: "Local", city: "Localhost" };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,isp`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`[Location] Failed to fetch location for IP ${ip}`);
      return defaultLocation;
    }

    const data = await response.json();

    if (data.status !== "success") {
      return defaultLocation;
    }

    return {
      ip,
      country: data.country || null,
      city: data.city || null,
      region: data.regionName || null,
      timezone: data.timezone || null,
      isp: data.isp || null,
    };
  } catch (error) {
    console.error("[Location] Error fetching location data:", error);
    return defaultLocation;
  }
}

/**
 * Get location info for current request
 */
export async function getCurrentLocation(): Promise<LocationInfo> {
  const ip = await getClientIP();
  return getLocationFromIP(ip);
}

// ========== SESSION TRUST & SECURITY ==========

export interface SessionContext {
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  userAgent: string;
  ip: string;
}

/**
 * Get complete session context from current request
 */
export async function getSessionContext(): Promise<SessionContext> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const ip = await getClientIP();
  
  const [deviceInfo, locationInfo] = await Promise.all([
    parseUserAgent(userAgent),
    getLocationFromIP(ip),
  ]);

  return {
    deviceInfo,
    locationInfo,
    userAgent,
    ip,
  };
}

/**
 * Calculate trust level for a session
 * 0 = new/untrusted
 * 1 = recognized (same device/location as before)
 * 2 = highly trusted (multiple successful logins from same device)
 */
export function calculateTrustLevel(params: {
  isFirstSession: boolean;
  previousLoginCount: number;
  sameDevice: boolean;
  sameLocation: boolean;
  daysSinceFirstLogin: number;
}): number {
  const { isFirstSession, previousLoginCount, sameDevice, sameLocation, daysSinceFirstLogin } = params;

  if (isFirstSession) return 0;

  // New device or location = reset to low trust
  if (!sameDevice || !sameLocation) return 0;

  // Build up trust over time and successful logins
  if (previousLoginCount >= 10 && daysSinceFirstLogin >= 30) return 2;
  if (previousLoginCount >= 3 && daysSinceFirstLogin >= 7) return 1;

  return 0;
}

/**
 * Detect suspicious activity patterns
 */
export function isSuspiciousActivity(params: {
  rapidLocationChange: boolean; // Login from different country within 1 hour
  unusualTime: boolean; // Login at unusual hours for user
  newDevice: boolean;
  newLocation: boolean;
  failedAttemptsRecent: number;
  vpnDetected: boolean;
}): boolean {
  const { rapidLocationChange, newDevice, newLocation, failedAttemptsRecent, vpnDetected } = params;

  // Strong indicators of suspicious activity
  if (rapidLocationChange && failedAttemptsRecent > 0) return true;
  if (vpnDetected && newDevice && failedAttemptsRecent >= 3) return true;
  
  // Multiple risk factors
  let riskScore = 0;
  if (rapidLocationChange) riskScore += 3;
  if (newDevice && newLocation) riskScore += 2;
  if (failedAttemptsRecent >= 3) riskScore += 2;
  if (vpnDetected) riskScore += 1;

  return riskScore >= 4;
}

// ========== SESSION ACTIVITY LOGGING ==========

export interface ActivityLog {
  action: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  isError: boolean;
  isSuspicious: boolean;
}

/**
 * Format activity action for logging
 */
export function formatAction(action: string): string {
  return action.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

/**
 * Determine if an action requires step-up authentication
 */
export function requiresStepUp(action: string): boolean {
  const sensitiveActions = [
    "password_change",
    "email_change",
    "2fa_disable",
    "account_delete",
    "admin_action",
    "role_change",
    "permission_change",
  ];

  return sensitiveActions.includes(action);
}

// ========== SESSION LIMITS ==========

export const SESSION_LIMITS = {
  MAX_CONCURRENT_SESSIONS: 5, // Maximum sessions per user
  SESSION_TIMEOUT_DEFAULT: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_TIMEOUT_REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days
  IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours of inactivity
  ACTIVITY_RETENTION_DAYS: 90, // Keep activity logs for 90 days
};

/**
 * Check if session should expire due to inactivity
 */
export function shouldExpireSession(lastActivityAt: Date, isRememberMe: boolean): boolean {
  const now = Date.now();
  const lastActivity = lastActivityAt.getTime();
  const timeSinceActivity = now - lastActivity;

  // Remember me sessions have longer timeout
  const timeout = isRememberMe 
    ? SESSION_LIMITS.SESSION_TIMEOUT_REMEMBER_ME 
    : SESSION_LIMITS.SESSION_TIMEOUT_DEFAULT;

  return timeSinceActivity > timeout;
}

/**
 * Get session expiration date
 */
export function getSessionExpiration(isRememberMe: boolean): Date {
  const timeout = isRememberMe
    ? SESSION_LIMITS.SESSION_TIMEOUT_REMEMBER_ME
    : SESSION_LIMITS.SESSION_TIMEOUT_DEFAULT;

  return new Date(Date.now() + timeout);
}

