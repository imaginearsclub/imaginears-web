import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/secure-session";

type ActivityItem = {
    id: string;
    kind: "event" | "application";
    title: string;
    sub: string;       // small subtitle (status/category/email etc.)
    when: string;      // ISO string
};

export async function GET() {
    try {
        await requireAdminSession();

        const [events, apps] = await Promise.all([
            prisma.event.findMany({
                select: { id: true, title: true, updatedAt: true, status: true, category: true },
                orderBy: { updatedAt: "desc" },
                take: 10,
            }),
            prisma.application.findMany({
                select: { id: true, name: true, email: true, status: true, updatedAt: true, role: true },
                orderBy: { updatedAt: "desc" },
                take: 10,
            }),
        ]);

        const eItems: ActivityItem[] = events.map((e) => ({
            id: e.id,
            kind: "event",
            title: e.title,
            sub: `${e.status} • ${e.category}`,
            when: e.updatedAt.toISOString(),
        }));

        const aItems: ActivityItem[] = apps.map((a) => ({
            id: a.id,
            kind: "application",
            title: a.name ?? "Application",
            sub: `${a.status} • ${a.role} • ${a.email}`,
            when: a.updatedAt.toISOString(),
        }));

        // Merge & sort (top 12)
        const merged = [...eItems, ...aItems]
            .sort((a, b) => (a.when < b.when ? 1 : -1))
            .slice(0, 12);

        return NextResponse.json(merged);
    } catch (e: any) {
        const code = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({ error: e?.message || "Server error" }, { status: code });
    }
}
