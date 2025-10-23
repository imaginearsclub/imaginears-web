import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
        const e = await prisma.event.findUnique({
            where: { id: params.id },
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
        const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({ error: e?.message || "Error" }, { status });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
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
            where: { id: params.id },
            data,
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({ error: e?.message || "Error" }, { status });
    }
}
