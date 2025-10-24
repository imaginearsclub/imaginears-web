import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/session';

export const runtime = "nodejs";

// Cache for 5 minutes to reduce database load
export const revalidate = 300;

// Buckets by day for last N (default 30) days based on Event.createdAt
export async function GET(req: Request){
    try {
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const {searchParams} = new URL(req.url);
        const rangeParam = searchParams.get('range') || '30';
        
        // Validate input is a number
        if (!/^\d+$/.test(rangeParam)) {
            return NextResponse.json({error: "Invalid range parameter"}, {status: 400});
        }
        
        const range = parseInt(rangeParam, 10);
        const days = Math.min(Math.max(range, 1), 90);

        // Use start of day for consistent date boundaries (UTC)
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);
        
        const start = new Date(end);
        start.setUTCDate(end.getUTCDate() - (days - 1));
        start.setUTCHours(0, 0, 0, 0);

        // Use database aggregation instead of fetching all records
        // This is much more efficient for large datasets
        const rows = await prisma.$queryRaw<Array<{date: string; count: bigint}>>`
            SELECT 
                DATE(createdAt) as date,
                COUNT(*)::bigint as count
            FROM "Event"
            WHERE createdAt >= ${start}
                AND createdAt <= ${end}
            GROUP BY DATE(createdAt)
            ORDER BY date ASC
        `;

        // Create map with all dates initialized to 0
        const map = new Map<string, number>();
        const tempDate = new Date(start);
        for (let i = 0; i < days; i++) {
            const key = tempDate.toISOString().slice(0, 10);
            map.set(key, 0);
            tempDate.setUTCDate(tempDate.getUTCDate() + 1);
        }

        // Fill in actual counts from database
        for (const row of rows) {
            const dateStr = String(row.date).slice(0, 10);
            map.set(dateStr, Number(row.count));
        }

        const data = Array.from(map.entries()).map(([key, count]) => ({
            date: key.slice(5), // MM-DD format
            count,
        }));

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("[Stats/Events] Error:", e);
        return NextResponse.json({error: "Server error"}, {status: 500});
    }
}
