import { NextResponse } from "next/server";
import { PrismaClient, EventStatus } from "@prisma/client";
import { expandEventOccurrences } from "@/lib/recurrence";
import { addDays } from "date-fns";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const days = Math.min(Number(searchParams.get("days") || 14), 60);
        const limit = Math.min(Number(searchParams.get("limit") || 200), 1000);

        const now = new Date();
        const until = addDays(now, days);

        const events = await prisma.event.findMany({
            where: { status: EventStatus.Published },
            orderBy: { startAt: "asc" },
        });

        let occ = events.flatMap((ev) => expandEventOccurrences(ev, now, until, limit));
        occ = occ.sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, limit);

        return NextResponse.json({ items: occ });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to load upcoming events" }, { status: 500 });
    }
}
