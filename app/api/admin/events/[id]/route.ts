import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/secure-session";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    try {
        await requireAdminSession();
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
        await requireAdminSession();
        const body = await req.json();

        const updated = await prisma.event.update({
            where: { id: params.id },
            data: {
                title: body.title !== undefined ? String(body.title).trim() : undefined,
                shortDescription: body.shortDescription ?? undefined,
                details: body.details ?? undefined,
                category: body.category ?? undefined,
                status: body.status ?? undefined,
                world: body.world ?? undefined,
                startAt: body.startAt ? new Date(body.startAt) : undefined,
                endAt:
                    body.endAt === null
                        ? null
                        : body.endAt
                            ? new Date(body.endAt)
                            : undefined,
            },
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        const status = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({ error: e?.message || "Error" }, { status });
    }
}
