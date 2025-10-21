import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Simple connectivity check
        await prisma.$queryRaw`SELECT 1 as ok`;

        // Optionally, check counts from your tables if they exist:
        const [apps, events] = await Promise.allSettled([
            prisma.application.count(),
            prisma.event.count(),
        ]);

        return NextResponse.json({
            ok: true,
            applicationCount: apps.status === "fulfilled" ? apps.value : null,
            eventCount: events.status === "fulfilled" ? events.value : null,
        });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
    }
}
