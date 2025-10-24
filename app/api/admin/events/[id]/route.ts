import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

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
        if (body.title !== undefined) data["title"] = String(body.title).trim();
        if (body.shortDescription !== undefined) data["shortDescription"] = body.shortDescription;
        if (body.details !== undefined) data["details"] = body.details;
        if (body.category !== undefined) data["category"] = body.category;
        if (body.status !== undefined) data["status"] = body.status;
        if (body.world !== undefined) data["world"] = body.world;
        if (body.startAt) data["startAt"] = new Date(body.startAt);
        if (body.endAt !== undefined) data["endAt"] = body.endAt === null ? null : new Date(body.endAt);

        const updated = await prisma.event.update({
            where: { id },
            data,
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        console.error("[Admin Events PATCH] Error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
