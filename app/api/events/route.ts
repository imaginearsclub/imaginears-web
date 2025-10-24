import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // avoid caching + make Prisma happy

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

// GET /api/events  -> simple list (for quick sanity check)
export async function GET() {
    try {
        const items = await prisma().event.findMany({
            orderBy: { updatedAt: "desc" },
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
        console.error("GET /api/events failed:", e);
        return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
    }
}

// POST /api/events -> create new event
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Accept local datetime strings from <input type="datetime-local">
        // and JSON arrays mapped to JSON fields
        const created = await prisma().event.create({
            data: {
                title: String(body.title || ""),
                world: String(body.world || ""),
                category: body.category || "Other",
                status: body.status || "Published",
                details: body.details ?? null,
                shortDescription: body.shortDescription ?? null,

                startAt: new Date(body.startAt),
                endAt: new Date(body.endAt),

                timezone: body.timezone || "America/New_York",
                recurrenceFreq: body.recurrenceFreq || "NONE",
                byWeekdayJson: Array.isArray(body.byWeekday) ? body.byWeekday : null,
                timesJson: Array.isArray(body.times) ? body.times : null,
                recurrenceUntil: body.recurrenceUntil ? new Date(body.recurrenceUntil) : null,
            },
            select: { id: true },
        });

        return NextResponse.json({ id: created.id }, { status: 201 });
    } catch (e) {
        console.error("POST /api/events failed:", e);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
