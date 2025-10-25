import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { API_SCOPES } from "@/lib/api-keys";

export const runtime = "nodejs";

/**
 * PATCH /api/admin/api-keys/[id]
 * Update an API key (name, scopes, status, etc.)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Build update object
    const updates: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "Name must be a non-empty string" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.scopes !== undefined) {
      if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
        return NextResponse.json({ error: "Scopes must be a non-empty array" }, { status: 400 });
      }
      
      const validScopes = Object.keys(API_SCOPES);
      const invalidScopes = body.scopes.filter((s: string) => !validScopes.includes(s));
      if (invalidScopes.length > 0) {
        return NextResponse.json({ 
          error: `Invalid scopes: ${invalidScopes.join(", ")}` 
        }, { status: 400 });
      }
      
      updates.scopes = body.scopes;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
      }
      updates.isActive = body.isActive;
    }

    if (body.rateLimit !== undefined) {
      const parsedRateLimit = parseInt(body.rateLimit);
      if (isNaN(parsedRateLimit) || parsedRateLimit < 1 || parsedRateLimit > 10000) {
        return NextResponse.json({ error: "Rate limit must be between 1 and 10000" }, { status: 400 });
      }
      updates.rateLimit = parsedRateLimit;
    }

    if (body.expiresAt !== undefined) {
      updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: updates,
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

    console.log(`[AUDIT] API key ${id} updated by admin ${session.user.id} - Fields: ${Object.keys(updates).join(", ")}`);

    return NextResponse.json({ apiKey });
  } catch (error: any) {
    console.error("[API Keys PATCH] Error:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Delete an API key
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get key info for audit log
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      select: { name: true, keyPrefix: true },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    console.log(`[AUDIT] API key ${id} (${apiKey.name} - ${apiKey.keyPrefix}) deleted by admin ${session.user.id}`);

    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error: any) {
    console.error("[API Keys DELETE] Error:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}

