import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        // Next.js 15+: params is now a Promise
        const { id } = await params;
        const e = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                shortDescription: true,
                details: true,
                category: true,
                status: true,
                world: true,
                startAt: true,
                endAt: true,
                updatedAt: true,
            },
        });
        if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(e);
    } catch (e: any) {
        console.error("[Admin Events GET] Error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        // Next.js 15+: params is now a Promise
        const { id } = await params;
        const body = await req.json();

        const data: Record<string, any> = {};
        
        // Validate and sanitize inputs
        if (body.title !== undefined) {
            const title = String(body.title).trim();
            if (title.length === 0 || title.length > 200) {
                return NextResponse.json({ error: "Title must be 1-200 characters" }, { status: 400 });
            }
            data["title"] = title;
        }
        
        if (body.shortDescription !== undefined) data["shortDescription"] = body.shortDescription;
        if (body.details !== undefined) data["details"] = body.details;
        
        if (body.category !== undefined) {
            const validCategories = ["Fireworks", "Seasonal", "MeetAndGreet", "Parade", "Other"];
            if (!validCategories.includes(body.category)) {
                return NextResponse.json({ error: "Invalid category" }, { status: 400 });
            }
            data["category"] = body.category;
        }
        
        if (body.status !== undefined) {
            const validStatuses = ["Draft", "Published", "Archived"];
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }
            data["status"] = body.status;
        }
        
        if (body.world !== undefined) {
            const world = String(body.world).trim();
            if (world.length === 0 || world.length > 100) {
                return NextResponse.json({ error: "World must be 1-100 characters" }, { status: 400 });
            }
            data["world"] = world;
        }
        
        if (body.startAt) {
            try {
                data["startAt"] = new Date(body.startAt);
            } catch {
                return NextResponse.json({ error: "Invalid startAt date" }, { status: 400 });
            }
        }
        
        if (body.endAt !== undefined) {
            if (body.endAt === null) {
                data["endAt"] = null;
            } else {
                try {
                    data["endAt"] = new Date(body.endAt);
                } catch {
                    return NextResponse.json({ error: "Invalid endAt date" }, { status: 400 });
                }
            }
        }

        const updated = await prisma.event.update({
            where: { id },
            data,
        });

        // Audit log for security
        console.log(`[AUDIT] Event ${id} updated by admin user ${session?.user?.id || 'unknown'} at ${new Date().toISOString()}`);
        console.log(`[AUDIT] Updated fields: ${Object.keys(data).join(', ')}`);

        return NextResponse.json(updated);
    } catch (e: any) {
        console.error("[Admin Events PATCH] Error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
