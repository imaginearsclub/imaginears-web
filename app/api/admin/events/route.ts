import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

// Force dynamic rendering for authenticated endpoints
// This ensures fresh session validation on every request
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const takeParam = searchParams.get("take") || "200";
        
        // Validate input
        if (!/^\d+$/.test(takeParam)) {
            return NextResponse.json({ error: "Invalid take parameter" }, { status: 400 });
        }
        
        const take = Math.min(Number(takeParam), 500);

        const items = await prisma.event.findMany({
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
