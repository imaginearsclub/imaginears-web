import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

// Force dynamic rendering for authenticated endpoints
// This ensures fresh session validation on every request
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Group by Application.status
        const rows = await prisma.application.groupBy({
            by: ["status"],
            _count: { _all: true },
        });

        const data = rows.map(r => ({ status: r.status, count: r._count._all }));
        return NextResponse.json(data);
    } catch (e: any) {
        console.error("[Stats/Applications] Error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

