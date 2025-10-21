// app/api/events/running/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "3", 10), 24);
    const now = new Date();

    const rows = await prisma.event.findMany({
        where: {
            status: "Published",
            startAt: { lte: now },
            endAt: { gte: now },
        },
        orderBy: [{ endAt: "asc" }],
        take: limit,
    });

    // Serialize dates to ISO for client
    const items = rows.map((e) => ({
        ...e,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
    }));

    return NextResponse.json(items);
}
