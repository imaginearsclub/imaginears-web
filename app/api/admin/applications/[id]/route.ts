import { NextResponse } from "next/server";
import { AppRole, AppStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 15+: params is now a Promise
        const { id } = await params;
        const body = await req.json();

        const patch: any = {};
        if (body.name !== undefined) patch.name = String(body.name);
        if (body.email !== undefined) patch.email = String(body.email);
        if (body.mcUsername !== undefined) patch.mcUsername = String(body.mcUsername);
        if (body.role !== undefined) patch.role = body.role as AppRole;
        if (body.status !== undefined) patch.status = body.status as AppStatus;
        if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes) : null;

        // (Optional) update some role-specific fields if you allow editing them here
        // e.g., patch.devPortfolioUrl = body.devPortfolioUrl ?? null

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

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 15+: params is now a Promise
        const { id } = await params;
        await prisma.application.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
    }
}
