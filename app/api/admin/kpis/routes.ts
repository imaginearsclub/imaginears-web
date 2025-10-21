import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdminSession} from '@/lib/secure-session';

// Very simple uptime
const startedAt = Date.now();
function formatUptime(ms: number) {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return `${d}d ${h}h`;
}

export async function GET(){
    try {
        await requireAdminSession();

        const [totalPlayers, totalEvents, activeApplications] = await Promise.all([
            prisma.user.count(), // Total players
            prisma.event.count(), // Total events
            prisma.application.count({
                where: {
                    status: {in: ['PENDING', 'APPROVED', 'DENIED'] as any},
                }
            }),
        ]);

        const uptime = formatUptime(Date.now() - startedAt);

        return NextResponse.json({
            totalPlayers,
            totalEvents,
            activeApplications,
            uptime,
        });
    } catch (e : any){
        const code = e?.message === "UNAUTHORIZED" ? 401 : 500;
        return NextResponse.json({error: e?.message || "Server error"}, {status: code});
    }
}
