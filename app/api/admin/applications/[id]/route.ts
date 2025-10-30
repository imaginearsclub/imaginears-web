import { NextResponse } from "next/server";
import { AppRole, AppStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { logAudit } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";
import { getClientIp, getUserAgent } from "@/lib/middleware/shared";
import {
  validateApplicationName,
  validateApplicationEmail,
  validateApplicationMcUsername,
  validateApplicationNotes,
  type ApplicationValidationResult,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Valid enum values
const VALID_ROLES: AppRole[] = ["Developer", "GuestServices", "Imaginear"];
const VALID_STATUSES: AppStatus[] = ["New", "InReview", "Approved", "Rejected"];

/**
 * Validate basic fields (name, email, notes)
 */
function validateBasicFields(body: Record<string, unknown>, patch: Record<string, unknown>): string | null {
  if (body["name"] !== undefined) {
    const name = validateApplicationName(body["name"]);
    if (!name) return "Name must be 1-100 characters";
    patch["name"] = name;
  }

  if (body["email"] !== undefined) {
    const email = validateApplicationEmail(body["email"]);
    if (!email) return "Invalid email address";
    patch["email"] = email;
  }

  if (body["notes"] !== undefined) {
    const notes = validateApplicationNotes(body["notes"]);
    if (notes === null && body["notes"]) return "Notes too long (max 1000 characters)";
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
function validateApplicationUpdate(body: Record<string, unknown>): ApplicationValidationResult<Record<string, unknown>> {
  const patch: Record<string, unknown> = {};

  // Validate basic text fields
  const basicError = validateBasicFields(body, patch);
  if (basicError) return { valid: false, error: basicError };

  // Validate enum fields
  const enumError = validateEnumFields(body, patch);
  if (enumError) return { valid: false, error: enumError };

  // Validate Minecraft username separately (special logic)
  if (body["mcUsername"] !== undefined) {
    const mc = validateApplicationMcUsername(body["mcUsername"]);
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

/**
 * PATCH /api/admin/applications/[id]
 * Update an application
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const PATCH = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:applications:update",
      limit: 30,
      window: 60,
      strategy: "sliding-window",
    },
    maxBodySize: 10000, // 10KB max
  },
  async (req, { userId, params }) => {
    const id = params!['id']!;
    const body = await req.json();

    // Validate all fields
    const validation = validateApplicationUpdate(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    try {
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
      const clientIP = getClientIp(req.headers);
      const userAgent = getUserAgent(req.headers);
      
      logAudit({
        timestamp: new Date().toISOString(),
        action: "user.updated",
        actor: { id: userId! },
        target: { id, type: "application", name: updated.name },
        details: { fields: Object.keys(validation.data), status: updated.status },
        ipAddress: clientIP,
        userAgent: userAgent || "Unknown",
        success: true,
      });

      log.info("Application updated", { 
        userId, 
        applicationId: id, 
        fields: Object.keys(validation.data) 
      });

      return NextResponse.json(updated);
    } catch (error) {
      log.error("Application update failed", { error, applicationId: id, userId });
      
      // Handle Prisma errors
      const err = error as { code?: string };
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
      
      throw error; // Let middleware handle other errors
    }
  }
);

/**
 * DELETE /api/admin/applications/[id]
 * Delete an application
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const DELETE = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:applications:delete",
      limit: 10, // Strict limit for deletions
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (req, { userId, params }) => {
    const id = params!['id']!;
    
    // Get application info before deleting for audit log
    const app = await prisma.application.findUnique({
      where: { id },
      select: { name: true, email: true, status: true }
    });
    
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    
    try {
      await prisma.application.delete({ where: { id } });
      
      // Security: Audit log (deletions are critical actions)
      const clientIP = getClientIp(req.headers);
      const userAgent = getUserAgent(req.headers);
      
      logAudit({
        timestamp: new Date().toISOString(),
        action: "user.deleted",
        actor: { id: userId! },
        target: { id, type: "application", name: app.name },
        details: { email: app.email, status: app.status },
        ipAddress: clientIP,
        userAgent: userAgent || "Unknown",
        success: true,
      });
      
      log.info("Application deleted", { 
        userId, 
        applicationId: id, 
        name: app.name 
      });
      
      return NextResponse.json({ ok: true });
    } catch (error) {
      log.error("Application deletion failed", { error, applicationId: id, userId });
      
      // Handle Prisma errors
      const err = error as { code?: string };
      if (err.code === "P2025") {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }
      
      throw error; // Let middleware handle other errors
    }
  }
);