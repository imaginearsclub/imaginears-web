import { NextResponse } from "next/server";
import { AppRole, AppStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limiter";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit-logger";
import { headers as nextHeaders } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Valid enum values
const VALID_ROLES: AppRole[] = ["Developer", "GuestServices", "Imaginear"];
const VALID_STATUSES: AppStatus[] = ["New", "InReview", "Approved", "Rejected"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidationResult = { valid: true; data: Record<string, unknown> } | { valid: false; error: string };

/**
 * Validate name field
 */
function validateName(name: unknown): string | null {
  const n = String(name).trim();
  if (n.length === 0 || n.length > 100) return null;
  return n;
}

/**
 * Validate email field
 */
function validateEmail(email: unknown): string | null {
  const e = String(email).trim().toLowerCase();
  if (!EMAIL_REGEX.test(e) || e.length > 255) return null;
  return e;
}

/**
 * Validate Minecraft username
 */
function validateMcUsername(mcUsername: unknown): string | null {
  const mc = String(mcUsername).trim();
  if (mc.length > 0 && (mc.length < 3 || mc.length > 16)) return null;
  return mc || null;
}

/**
 * Validate notes field
 */
function validateNotes(notes: unknown): string | null {
  const n = notes ? String(notes).trim() : null;
  if (n && n.length > 10000) return null;
  return n;
}

/**
 * Validate basic fields (name, email, notes)
 */
function validateBasicFields(body: Record<string, unknown>, patch: Record<string, unknown>): string | null {
  if (body["name"] !== undefined) {
    const name = validateName(body["name"]);
    if (!name) return "Name must be 1-100 characters";
    patch["name"] = name;
  }

  if (body["email"] !== undefined) {
    const email = validateEmail(body["email"]);
    if (!email) return "Invalid email address";
    patch["email"] = email;
  }

  if (body["notes"] !== undefined) {
    const notes = validateNotes(body["notes"]);
    if (notes === null && body["notes"]) return "Notes too long (max 10000 characters)";
    patch["notes"] = notes;
  }

  return null;
}

/**
 * Validate enum fields (role, status)
 */
function validateEnumFields(body: Record<string, unknown>, patch: Record<string, unknown>): string | null {
  if (body["role"] !== undefined) {
    if (!VALID_ROLES.includes(body["role"] as AppRole)) return "Invalid role";
    patch["role"] = body["role"];
  }

  if (body["status"] !== undefined) {
    if (!VALID_STATUSES.includes(body["status"] as AppStatus)) return "Invalid status";
    patch["status"] = body["status"];
  }

  return null;
}

/**
 * Validate all application update fields
 */
function validateApplicationUpdate(body: Record<string, unknown>): ValidationResult {
  const patch: Record<string, unknown> = {};

  // Validate basic text fields
  const basicError = validateBasicFields(body, patch);
  if (basicError) return { valid: false, error: basicError };

  // Validate enum fields
  const enumError = validateEnumFields(body, patch);
  if (enumError) return { valid: false, error: enumError };

  // Validate Minecraft username separately (special logic)
  if (body["mcUsername"] !== undefined) {
    const mc = validateMcUsername(body["mcUsername"]);
    if (mc === null && String(body["mcUsername"]).trim().length > 0) {
      return { valid: false, error: "Minecraft username must be 3-16 characters" };
    }
    patch["mcUsername"] = mc;
  }

  if (Object.keys(patch).length === 0) {
    return { valid: false, error: "No valid fields to update" };
  }

  return { valid: true, data: patch };
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
            key: "admin:applications:update",
            limit: 30,
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

        const { id } = await params;
        const body = await req.json();

        // Validate all fields
        const validation = validateApplicationUpdate(body);
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const updated = await prisma.application.update({
            where: { id },
            data: validation.data,
            select: {
                id: true,
                name: true,
                email: true,
                mcUsername: true,
                role: true,
                status: true,
                notes: true,
                updatedAt: true,
            },
        });

        // Security: Audit log
        logAudit({
            timestamp: new Date().toISOString(),
            action: "user.updated",
            actor: { id: session.user.id, email: session.user.email },
            target: { id, type: "application", name: updated.name },
            details: { fields: Object.keys(validation.data), status: updated.status },
            ipAddress: clientIP,
            userAgent: h.get("user-agent") || "Unknown",
            success: true,
        });

        return NextResponse.json(updated, {
            headers: {
                "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            },
        });
    } catch (e) {
        log.error("Application update failed", { error: e, applicationId: (await params).id });
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAdmin();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting (stricter for deletions)
        const h = await nextHeaders();
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        `user:${session.user.id}`;

        const rateLimitResult = await rateLimit(clientIP, {
            key: "admin:applications:delete",
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

        const { id } = await params;
        
        // Get application info before deleting for audit log
        const app = await prisma.application.findUnique({
            where: { id },
            select: { name: true, email: true, status: true }
        });
        
        if (!app) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }
        
        await prisma.application.delete({ where: { id } });
        
        // Security: Audit log (deletions are critical actions)
        logAudit({
            timestamp: new Date().toISOString(),
            action: "user.deleted",
            actor: { id: session.user.id, email: session.user.email },
            target: { id, type: "application", name: app.name },
            details: { email: app.email, status: app.status },
            ipAddress: clientIP,
            userAgent: h.get("user-agent") || "Unknown",
            success: true,
        });
        
        return NextResponse.json({ ok: true }, {
            headers: {
                "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            },
        });
    } catch (e) {
        log.error("Application deletion failed", { error: e, applicationId: (await params).id });
        return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
    }
}
