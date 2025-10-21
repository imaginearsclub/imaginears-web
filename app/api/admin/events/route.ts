import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let _prisma: PrismaClient | null = null;
function prisma() {
    if (!_prisma) {
        // @ts-expect-error dev singleton
        _prisma = globalThis.__PRISMA__ ?? new PrismaClient();
        // @ts-expect-error dev singleton
        if (!globalThis.__PRISMA__) globalThis.__PRISMA__ = _prisma;
    }
    return _prisma!;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const take = Math.min(Number(searchParams.get("take") || 200), 500);

        const items = await prisma().event.findMany({
            orderBy: { updatedAt: "desc" },
            take,
            select: {
                id: true,
                title: true,
                world: true,
                category: true,
                status: true,
                startAt: true,
                endAt: true,
                timezone: true,
                recurrenceFreq: true,
                byWeekdayJson: true,
                timesJson: true,
                recurrenceUntil: true,
                shortDescription: true,
                details: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ items });
    } catch (e) {
        console.error("GET /api/admin/events failed:", e);
        return NextResponse.json({ error: "Failed to load events", items: [] }, { status: 500 });
    }
}
