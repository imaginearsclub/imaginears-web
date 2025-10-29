import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApiKey, API_SCOPES } from "@/lib/api-keys";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";
import { getClientIp, getUserAgent } from "@/lib/middleware/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateKeyValidation = { valid: true; data: CreateKeyData } | { valid: false; error: string };

interface CreateKeyData {
  name: string;
  scopes: string[];
  rateLimit: number;
  description: string | null;
  expiresAt: Date | null;
}

/**
 * Validate API key creation request
 */
function validateCreateRequest(body: Record<string, unknown>): CreateKeyValidation {
  const { name, description, scopes, rateLimit: rl, expiresAt } = body;

  // Name validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { valid: false, error: "Name is required" };
  }

  // Scopes validation
  if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
    return { valid: false, error: "At least one scope is required" };
  }

  const validScopes = Object.keys(API_SCOPES);
  const invalidScopes = scopes.filter((s) => !validScopes.includes(s as string));
  if (invalidScopes.length > 0) {
    return { valid: false, error: `Invalid scopes: ${invalidScopes.join(", ")}` };
  }

  // Rate limit validation
  const parsedRateLimit = rl ? parseInt(rl as string) : 100;
  if (parsedRateLimit < 1 || parsedRateLimit > 10000) {
    return { valid: false, error: "Rate limit must be between 1 and 10000" };
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      scopes: scopes as string[],
      rateLimit: parsedRateLimit,
      description: (description as string)?.trim() || null,
      expiresAt: expiresAt ? new Date(expiresAt as string) : null,
    },
  };
}

/**
 * GET /api/admin/api-keys
 * List all API keys (without the actual key value)
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const GET = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:api-keys:list",
      limit: 60,
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId }) => {
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        rateLimit: true,
        lastUsedAt: true,
        usageCount: true,
        description: true,
        expiresAt: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    log.info("API keys listed", { userId, count: apiKeys.length });

    return NextResponse.json({ apiKeys });
  }
);

/**
 * POST /api/admin/api-keys
 * Create a new API key
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const POST = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:api-keys:create",
      limit: 10, // Strict limit for key creation
      window: 60,
      strategy: "sliding-window",
    },
    maxBodySize: 5000, // 5KB max
  },
  async (req, { userId }) => {
    const body = await req.json();
    const validation = validateCreateRequest(body);
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { key, keyPrefix, hashedKey } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name: validation.data.name,
        key: hashedKey,
        keyPrefix,
        scopes: validation.data.scopes,
        rateLimit: validation.data.rateLimit,
        description: validation.data.description,
        expiresAt: validation.data.expiresAt,
        createdById: userId!,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        rateLimit: true,
        description: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Audit log
    const clientIP = getClientIp(req.headers);
    const userAgent = getUserAgent(req.headers);
    
    logAudit({
      timestamp: new Date().toISOString(),
      action: "api_key.created",
      actor: { id: userId! },
      target: { id: apiKey.id, type: "api_key", name: apiKey.name },
      details: { scopes: validation.data.scopes, keyPrefix },
      ipAddress: clientIP,
      userAgent: userAgent || "Unknown",
      success: true,
    });

    log.info("API key created", { userId, keyId: apiKey.id, keyPrefix });

    return NextResponse.json({ 
      apiKey: { ...apiKey, key },
      message: "API key created successfully. Save this key - it won't be shown again!" 
    }, { status: 201 });
  }
);

