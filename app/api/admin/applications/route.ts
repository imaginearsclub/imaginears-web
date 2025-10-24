import { NextResponse } from "next/server";
import { PrismaClient, AppStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as AppStatus | null; // "New" | "InReview" | ...
        const q = searchParams.get("q")?.trim() || "";
        const take = Math.min(Number(searchParams.get("take") || 50), 200);
        const cursor = searchParams.get("cursor") || ""; // optional pagination

        const where: any = {};
        if (status) where.status = status;
        if (q) {
            where.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { mcUsername: { contains: q, mode: "insensitive" } },
                { discordUser: { contains: q, mode: "insensitive" } },
            ];
        }

        const items = await prisma.application.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            select: {
                id: true,
                name: true,
                email: true,
                mcUsername: true,
                role: true,
                status: true,
                createdAt: true,
                notes: true,
            },
        });

        const nextCursor = items.length === take ? items[items.length - 1]?.id ?? null : null;

        return NextResponse.json({ items, nextCursor });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
    }
}
