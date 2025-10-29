import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { API_SCOPES } from "@/lib/api-keys";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";
import { getClientIp, getUserAgent } from "@/lib/middleware/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ApiKeyUpdate {
  name?: string;
  description?: string | null;
  scopes?: string[];
  isActive?: boolean;
  rateLimit?: number;
  expiresAt?: Date | null;
}

type ValidationResult = { valid: true; updates: ApiKeyUpdate } | { valid: false; error: string };

/**
 * Validate name field
 */
function validateName(name: unknown): string | null {
  if (typeof name !== "string" || name.trim().length === 0) return null;
  return name.trim();
}

/**
 * Validate scopes field
 */
function validateScopes(scopes: unknown): string[] | null {
  if (!Array.isArray(scopes) || scopes.length === 0) return null;
  
  const validScopes = Object.keys(API_SCOPES);
  const invalidScopes = scopes.filter((s) => !validScopes.includes(s as string));
  if (invalidScopes.length > 0) return null;
  
  return scopes;
}

/**
 * Validate rate limit field
 */
function validateRateLimit(value: unknown): number | null {
  const parsed = parseInt(value as string);
  if (isNaN(parsed) || parsed < 1 || parsed > 10000) return null;
  return parsed;
}

/**
 * Apply validated field to updates object (type-safe)
 */
function applyField(
  updates: ApiKeyUpdate,
  field: "name" | "scopes" | "rateLimit",
  value: string | string[] | number | null,
  body: Record<string, unknown>,
  errorMsg: string
): string | null {
  // Safe: field is constrained to literal types, not user input
  /* eslint-disable-next-line security/detect-object-injection */
  const fieldValue = body[field];
  if (fieldValue === undefined) return null;
  if (value === null) return errorMsg;
  
  // Type-safe assignment with explicit checks
  switch (field) {
    case "name":
      if (typeof value === "string") updates.name = value;
      break;
    case "scopes":
      if (Array.isArray(value)) updates.scopes = value;
      break;
    case "rateLimit":
      if (typeof value === "number") updates.rateLimit = value;
      break;
  }
  
  return null;
}

/**
 * Validate and build update object from request body
 */
function validateUpdates(body: Record<string, unknown>): ValidationResult {
  const updates: ApiKeyUpdate = {};

  // Validate each field
  const nameError = applyField(updates, "name", validateName(body["name"]), body, "Name must be a non-empty string");
  if (nameError) return { valid: false, error: nameError };

  const scopesError = applyField(updates, "scopes", validateScopes(body["scopes"]), body, "Scopes must be a valid non-empty array");
  if (scopesError) return { valid: false, error: scopesError };

  const rateLimitError = applyField(updates, "rateLimit", validateRateLimit(body["rateLimit"]), body, "Rate limit must be between 1 and 10000");
  if (rateLimitError) return { valid: false, error: rateLimitError };

  // Simple fields
  if (body["description"] !== undefined) {
    updates.description = (body["description"] as string)?.trim() || null;
  }

  if (body["isActive"] !== undefined) {
    if (typeof body["isActive"] !== "boolean") {
      return { valid: false, error: "isActive must be a boolean" };
    }
    updates.isActive = body["isActive"];
  }

  if (body["expiresAt"] !== undefined) {
    updates.expiresAt = body["expiresAt"] ? new Date(body["expiresAt"] as string) : null;
  }

  if (Object.keys(updates).length === 0) {
    return { valid: false, error: "No valid fields to update" };
  }

  return { valid: true, updates };
}

/**
 * PATCH /api/admin/api-keys/[id]
 * Update an API key (name, scopes, status, etc.)
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const PATCH = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:api-keys:update",
      limit: 30,
      window: 60,
      strategy: "sliding-window",
    },
    maxBodySize: 5000, // 5KB max
  },
  async (req, { userId, params }) => {
    const id = params!['id']!;
    const body = await req.json();

    // Validate updates
    const validation = validateUpdates(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
      const apiKey = await prisma.apiKey.update({
        where: { id },
        data: validation.updates,
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          isActive: true,
          rateLimit: true,
          description: true,
          expiresAt: true,
          lastUsedAt: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Security: Audit log
      const clientIP = getClientIp(req.headers);
      const userAgent = getUserAgent(req.headers);
      
      logAudit({
        timestamp: new Date().toISOString(),
        action: "api_key.updated",
        actor: { id: userId! },
        target: { id, type: "api_key", name: apiKey.name },
        details: { fields: Object.keys(validation.updates), keyPrefix: apiKey.keyPrefix },
        ipAddress: clientIP,
        userAgent: userAgent || "Unknown",
        success: true,
      });

      log.info("API key updated", { userId, keyId: id, fields: Object.keys(validation.updates) });

      return NextResponse.json({ apiKey });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      log.error("API key update failed", { error: err, apiKeyId: id, userId });
      
      if (err.code === "P2025") {
        return NextResponse.json({ error: "API key not found" }, { status: 404 });
      }
      
      throw error; // Let middleware handle other errors
    }
  }
);

/**
 * DELETE /api/admin/api-keys/[id]
 * Delete an API key
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const DELETE = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:api-keys:delete",
      limit: 10, // Strict limit for deletions
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (req, { userId, params }) => {
    const id = params!['id']!;

    // Get key info for audit log before deletion
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { name: true, keyPrefix: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    try {
      await prisma.apiKey.delete({ where: { id } });

      // Security: Audit log
      const clientIP = getClientIp(req.headers);
      const userAgent = getUserAgent(req.headers);
      
      logAudit({
        timestamp: new Date().toISOString(),
        action: "api_key.deleted",
        actor: { id: userId! },
        target: { id, type: "api_key", name: apiKey.name },
        details: { keyPrefix: apiKey.keyPrefix },
        ipAddress: clientIP,
        userAgent: userAgent || "Unknown",
        success: true,
      });

      log.info("API key deleted", { userId, keyId: id, keyPrefix: apiKey.keyPrefix });

      return NextResponse.json({ message: "API key deleted successfully" });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      log.error("API key deletion failed", { error: err, apiKeyId: id, userId });
      
      if (err.code === "P2025") {
        return NextResponse.json({ error: "API key not found" }, { status: 404 });
      }
      
      throw error; // Let middleware handle other errors
    }
  }
);