import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { generateApiKey, API_SCOPES, type ApiScope } from "@/lib/api-keys";

export const runtime = "nodejs";

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

    console.log(`[AUDIT] API keys list accessed by admin ${session.user?.id} at ${new Date().toISOString()}`);

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("[API Keys GET] Error:", error);
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

    const body = await req.json();
    const { name, description, scopes, rateLimit, expiresAt } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ error: "At least one scope is required" }, { status: 400 });
    }

    // Validate scopes
    const validScopes = Object.keys(API_SCOPES);
    const invalidScopes = scopes.filter((s: string) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json({ 
        error: `Invalid scopes: ${invalidScopes.join(", ")}`,
        validScopes 
      }, { status: 400 });
    }

    // Validate rate limit
    const parsedRateLimit = rateLimit ? parseInt(rateLimit) : 100;
    if (parsedRateLimit < 1 || parsedRateLimit > 10000) {
      return NextResponse.json({ error: "Rate limit must be between 1 and 10000" }, { status: 400 });
    }

    // Generate API key
    const { key, keyPrefix, hashedKey } = generateApiKey();

    // Create in database
    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: hashedKey,
        keyPrefix,
        scopes,
        rateLimit: parsedRateLimit,
        description: description?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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

    console.log(`[AUDIT] API key created by admin ${session.user.id} - Name: ${name}, Scopes: ${scopes.join(", ")}`);

    // Return the key ONLY on creation (it won't be shown again)
    return NextResponse.json({ 
      apiKey: {
        ...apiKey,
        key, // Only returned once!
      },
      message: "API key created successfully. Save this key - it won't be shown again!" 
    });
  } catch (error) {
    console.error("[API Keys POST] Error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

