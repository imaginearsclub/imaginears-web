import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/session';
import {getMinecraftServerStatus, getUptimePercentage, getPlayerCountHistory} from '@/lib/minecraft-status';

// Configuration
const MINECRAFT_SERVER = process.env['MINECRAFT_SERVER_ADDRESS'] || 'iears.us';

// API uptime tracking (fallback)
const startedAt = Date.now();
function formatApiUptime(ms: number) {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return `${d}d ${h}h`;
}

export async function GET(){
    try {
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        // Fetch database stats and server status in parallel
        const [totalPlayers, totalEvents, activeApplications, serverStatus] = await Promise.all([
            prisma.user.count(), // Total players
            prisma.event.count(), // Total events
            prisma.application.count({
                where: {
                    status: {in: ['New', 'InReview', 'Approved']},
                }
            }),
            getMinecraftServerStatus(MINECRAFT_SERVER),
        ]);

        // Use API uptime as fallback
        const apiUptime = formatApiUptime(Date.now() - startedAt);
        
        // Get uptime percentage (based on last 100 checks)
        const uptimePercentage = getUptimePercentage(MINECRAFT_SERVER);
        
        // Get player count history for graphing
        const playerHistory = getPlayerCountHistory(MINECRAFT_SERVER);

        return NextResponse.json({
            totalPlayers,
            totalEvents,
            activeApplications,
            apiUptime,
            // Minecraft server status
            server: {
                address: MINECRAFT_SERVER,
                online: serverStatus.online,
                version: serverStatus.version,
                players: {
                    online: serverStatus.playersOnline ?? 0,
                    max: serverStatus.playersMax ?? 0,
                },
                latency: serverStatus.latency,
                uptimePercentage: uptimePercentage,
                playerHistory: playerHistory,
                error: serverStatus.error,
            },
        });
    } catch (e : any){
        console.error("[KPIs] Error:", e);
        return NextResponse.json({error: "Server error"}, {status: 500});
    }
}

