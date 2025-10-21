import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdminSession} from '@/lib/secure-session';

// Buckets by day fro last N (default 30) days based on Event.createdAt
export async function GET(req: Request){
    try {
        await requireAdminSession();

        const {searchParams} = new URL(req.url);
        const range = parseInt(searchParams.get('range') || '30', 10);
        const days = Math.min(Math.max(range, 1), 90);

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));

        // Pull all created in window
        const rows = await prisma.event.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                }
            },
            select: {
                createdAt: true},
        });

        // Bucket counts per yyyy-mm-dd
        const map = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            map.set(key, 0);
        }

        for (const r of rows) {
            const key = r.createdAt.toISOString().slice(0, 10);
            if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
        }

        const data = Array.from(map.entries()).map(([key, count]) => ({
            date: key.slice(5),
            count,
        }));

        return NextResponse.json(data);
    } catch (e: any) {
        const code = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({error: e?.message || "Server error"}, {status: code});
    }
}
