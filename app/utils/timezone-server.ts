/**
 * Server-only timezone utilities
 * These functions can ONLY be used in server components
 */

import "server-only";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SITE_TZ } from "./timezone-client";

/**
 * Get user's timezone preference from session
 * Falls back to SITE_TZ if not logged in or no preference set
 */
export async function getUserTimezone(): Promise<string> {
    try {
        const session = await getServerSession();
        
        if (!session?.user?.id) {
            return SITE_TZ;
        }
        
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { timezone: true },
        });
        
        return user?.timezone || SITE_TZ;
    } catch (error) {
        console.error("Error fetching user timezone:", error);
        return SITE_TZ;
    }
}

