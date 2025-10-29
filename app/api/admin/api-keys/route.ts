import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateApiKey, API_SCOPES } from "@/lib/api-keys";
import { rateLimit } from "@/lib/rate-limiter";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit-logger";
import { headers as nextHeaders } from "next/headers";

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
 */
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const h = await nextHeaders();
    const forwardedFor = h.get("x-forwarded-for");
    const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                    h.get("x-real-ip") || 
                    `user:${session.user?.id}`;

    const rateLimitResult = await rateLimit(clientIP, {
      key: "admin:api-keys:list",
      limit: 60,
      window: 60,
      strategy: "sliding-window",
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetAfter.toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

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

    return NextResponse.json({ apiKeys }, {
      headers: {
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    log.error("API keys list failed", { error });
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const h = await nextHeaders();
    const forwardedFor = h.get("x-forwarded-for");
    const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                    h.get("x-real-ip") || 
                    `user:${session.user.id}`;

    const rateLimitResult = await rateLimit(clientIP, {
      key: "admin:api-keys:create",
      limit: 10,
      window: 60,
      strategy: "sliding-window",
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetAfter.toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

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
        createdById: session.user.id,
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
    logAudit({
      timestamp: new Date().toISOString(),
      action: "api_key.created",
      actor: { id: session.user.id, email: session.user.email },
      target: { id: apiKey.id, type: "api_key", name: apiKey.name },
      details: { scopes: validation.data.scopes, keyPrefix },
      ipAddress: clientIP,
      userAgent: h.get("user-agent") || "Unknown",
      success: true,
    });

    return NextResponse.json({ 
      apiKey: { ...apiKey, key },
      message: "API key created successfully. Save this key - it won't be shown again!" 
    }, {
      headers: {
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    log.error("API key creation failed", { error });
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

