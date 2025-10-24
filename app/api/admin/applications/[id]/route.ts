import { NextResponse } from "next/server";
import { AppRole, AppStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

// Valid enum values
const VALID_ROLES: AppRole[] = ["Developer", "GuestServices", "Imaginear"];
const VALID_STATUSES: AppStatus[] = ["New", "InReview", "Approved", "Rejected"];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Next.js 15+: params is now a Promise
        const { id } = await params;
        const body = await req.json();

        const patch: any = {};
        
        // Validate and sanitize inputs
        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (name.length === 0 || name.length > 100) {
                return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 });
            }
            patch.name = name;
        }
        
        if (body.email !== undefined) {
            const email = String(body.email).trim().toLowerCase();
            if (!EMAIL_REGEX.test(email) || email.length > 255) {
                return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
            }
            patch.email = email;
        }
        
        if (body.mcUsername !== undefined) {
            const mcUsername = String(body.mcUsername).trim();
            if (mcUsername.length > 0 && (mcUsername.length < 3 || mcUsername.length > 16)) {
                return NextResponse.json({ error: "Minecraft username must be 3-16 characters" }, { status: 400 });
            }
            patch.mcUsername = mcUsername || null;
        }
        
        if (body.role !== undefined) {
            if (!VALID_ROLES.includes(body.role)) {
                return NextResponse.json({ error: "Invalid role" }, { status: 400 });
            }
            patch.role = body.role as AppRole;
        }
        
        if (body.status !== undefined) {
            if (!VALID_STATUSES.includes(body.status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            patch.status = body.status as AppStatus;
        }
        
        if (body.notes !== undefined) {
            const notes = body.notes ? String(body.notes).trim() : null;
            if (notes && notes.length > 10000) {
                return NextResponse.json({ error: "Notes too long (max 10000 characters)" }, { status: 400 });
            }
            patch.notes = notes;
        }

        // Ensure we have at least one field to update
        if (Object.keys(patch).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const updated = await prisma.application.update({
            where: { id },
            data: patch,
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

        // Audit log for security
        console.log(`[AUDIT] Application ${id} updated by admin user ${session?.user?.id || 'unknown'} at ${new Date().toISOString()}`);
        console.log(`[AUDIT] Updated fields: ${Object.keys(patch).join(', ')}`);

        return NextResponse.json(updated);
    } catch (e) {
        console.error("[Admin Applications PATCH] Error:", e);
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Next.js 15+: params is now a Promise
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
        
        // Audit log for security - deleting applications is a critical action
        console.log(`[AUDIT] Application ${id} DELETED by admin user ${session?.user?.id || 'unknown'} at ${new Date().toISOString()}`);
        console.log(`[AUDIT] Deleted application: ${app.name} (${app.email}) - Status: ${app.status}`);
        
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("[Admin Applications DELETE] Error:", e);
        return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
    }
}
