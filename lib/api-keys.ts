import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

/**
 * API Key Format: sk_live_[32 random chars]
 * - sk = secret key
 * - live = environment (could be 'test' for testing)
 * - Stored hashed in database for security
 */

// Available scopes for API keys
export const API_SCOPES = {
  // Events
  "events:read": "Read event information",
  "events:write": "Create and modify events",
  
  // Applications  
  "applications:read": "Read application data",
  "applications:write": "Create and modify applications",
  
  // Users
  "users:read": "Read user information",
  
  // Server status
  "server:read": "Read server status and metrics",
  
  // Public data
  "public:read": "Read public data (events, etc.)",
} as const;

export type ApiScope = keyof typeof API_SCOPES;

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; keyPrefix: string; hashedKey: string } {
  const randomPart = randomBytes(16).toString("hex"); // 32 chars
  const key = `sk_live_${randomPart}`;
  const keyPrefix = key.substring(0, 16); // "sk_live_12345678"
  const hashedKey = hashApiKey(key);
  
  return { key, keyPrefix, hashedKey };
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key and return its data
 */
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  apiKey?: {
    id: string;
    name: string;
    scopes: ApiScope[];
    rateLimit: number;
    createdById: string;
  };
  error?: string;
}> {
  try {
    if (!key || !key.startsWith("sk_")) {
      console.log("[API Key Validation] Invalid key format");
      return { valid: false, error: "Invalid API key format" };
    }

    const hashedKey = hashApiKey(key);
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      select: {
        id: true,
        name: true,
        scopes: true,
        isActive: true,
        expiresAt: true,
        rateLimit: true,
        createdById: true,
      },
    });

    if (!apiKey) {
      console.log("[API Key Validation] Key not found in database");
      return { valid: false, error: "API key not found" };
    }

    if (!apiKey.isActive) {
      console.log("[API Key Validation] Key is disabled");
      return { valid: false, error: "API key is disabled" };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      console.log("[API Key Validation] Key has expired");
      return { valid: false, error: "API key has expired" };
    }

    console.log("[API Key Validation] Key validated successfully:", {
      name: apiKey.name,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit
    });

    // Update usage stats (fire and forget to not slow down request)
    prisma.apiKey.update({
      where: { key: hashedKey },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    }).catch(err => console.error("Failed to update API key usage:", err));

    return {
      valid: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes as ApiScope[],
        rateLimit: apiKey.rateLimit,
        createdById: apiKey.createdById,
      },
    };
  } catch (error) {
    console.error("[API Key Validation] Error:", error);
    return { valid: false, error: "Failed to validate API key" };
  }
}

/**
 * Check if an API key has a specific scope
 */
export function hasScope(scopes: ApiScope[], requiredScope: ApiScope): boolean {
  return scopes.includes(requiredScope);
}

/**
 * Extract API key from request headers
 * Supports: Authorization: Bearer sk_live_xxx or X-API-Key: sk_live_xxx
 */
export function extractApiKey(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers.get("X-API-Key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Rate limiting check
 * Returns true if rate limit is exceeded
 */
export async function checkRateLimit(
  identifier: string, 
  endpoint: string, 
  limit: number = 100
): Promise<{ limited: boolean; remaining: number; resetAt: Date }> {
  try {
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMinutes(Math.floor(now.getMinutes()), 0, 0); // Round to minute

    // Get or create rate limit entry
    const rateLimit = await prisma.rateLimit.upsert({
      where: {
        identifier_endpoint_windowStart: {
          identifier,
          endpoint,
          windowStart,
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        identifier,
        endpoint,
        windowStart,
        count: 1,
      },
    });

    const resetAt = new Date(windowStart);
    resetAt.setMinutes(resetAt.getMinutes() + 1);

    return {
      limited: rateLimit.count > limit,
      remaining: Math.max(0, limit - rateLimit.count),
      resetAt,
    };
  } catch (error) {
    console.error("[Rate Limit] Error:", error);
    // On error, allow the request (fail open)
    return { limited: false, remaining: limit, resetAt: new Date() };
  }
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export async function cleanupRateLimits() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  await prisma.rateLimit.deleteMany({
    where: {
      windowStart: {
        lt: oneHourAgo,
      },
    },
  });
}

/**
 * Middleware helper for protecting API routes
 */
export async function requireApiKey(
  req: Request,
  requiredScope?: ApiScope
): Promise<
  | { authorized: true; apiKey: { id: string; name: string; scopes: ApiScope[]; createdById: string } }
  | { authorized: false; error: string; status: number }
> {
  const key = extractApiKey(req);
  
  if (!key) {
    return { 
      authorized: false, 
      error: "API key required. Provide via 'Authorization: Bearer YOUR_KEY' or 'X-API-Key: YOUR_KEY' header", 
      status: 401 
    };
  }

  const validation = await validateApiKey(key);
  
  if (!validation.valid || !validation.apiKey) {
    return { 
      authorized: false, 
      error: validation.error || "Invalid API key", 
      status: 401 
    };
  }

  // Check scope if required
  if (requiredScope) {
    const hasRequiredScope = hasScope(validation.apiKey.scopes, requiredScope);
    console.log("[requireApiKey] Scope check:", {
      requiredScope,
      apiKeyScopes: validation.apiKey.scopes,
      hasRequiredScope
    });
    
    if (!hasRequiredScope) {
      return { 
        authorized: false, 
        error: `Missing required scope: ${requiredScope}. Available scopes: ${validation.apiKey.scopes.join(", ")}`, 
        status: 403 
      };
    }
  }

  // Check rate limit
  const endpoint = new URL(req.url).pathname;
  console.log("[requireApiKey] Checking rate limit for endpoint:", endpoint);
  
  const rateLimitResult = await checkRateLimit(
    validation.apiKey.id, 
    endpoint, 
    validation.apiKey.rateLimit
  );

  if (rateLimitResult.limited) {
    return { 
      authorized: false, 
      error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)}s`, 
      status: 429 
    };
  }

  console.log("[requireApiKey] Authorization successful");
  return { authorized: true, apiKey: validation.apiKey };
}

