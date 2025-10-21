import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/secure-session";

export async function GET() {
    try {
        await requireAdminSession();

        // Group by Application.status
        const rows = await prisma.application.groupBy({
            by: ["status"],
            _count: { _all: true },
        });

        const data = rows.map(r => ({ status: r.status, count: r._count._all }));
        return NextResponse.json(data);
    } catch (e: any) {
        const code = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({ error: e?.message || "Server error" }, { status: code });
    }
}
