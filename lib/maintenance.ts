import { prisma } from "@/lib/prisma";

/**
 * Check if the site is in maintenance mode
 * @param userIP - Optional user IP to check against allowed IPs
 * @returns true if site is in maintenance mode and user should be redirected
 */
export async function isMaintenanceMode(userIP?: string): Promise<boolean> {
    try {
        const settings = await prisma.appSettings.findUnique({
            where: { id: "global" },
            select: { maintenance: true }
        });

        if (!settings?.maintenance) {
            return false;
        }

        const maintenance = settings.maintenance as any;
        
        // Check if maintenance mode is enabled
        if (!maintenance?.enabled) {
            return false;
        }

        // Check if user IP is in allowed list (bypass maintenance)
        if (userIP && maintenance?.allowedIPs && Array.isArray(maintenance.allowedIPs)) {
            if (maintenance.allowedIPs.includes(userIP)) {
                return false; // Allow this IP through
            }
        }

        return true; // Site is in maintenance mode
    } catch (error) {
        console.error("[Maintenance] Error checking maintenance mode:", error);
        return false; // On error, don't block access
    }
}

/**
 * Get maintenance settings
 */
export async function getMaintenanceSettings() {
    try {
        const settings = await prisma.appSettings.findUnique({
            where: { id: "global" },
            select: { maintenance: true }
        });

        const maintenance = settings?.maintenance as any;
        return {
            enabled: maintenance?.enabled || false,
            message: maintenance?.message || "We'll be back soon!",
            allowedIPs: maintenance?.allowedIPs || []
        };
    } catch {
        return {
            enabled: false,
            message: "We'll be back soon!",
            allowedIPs: []
        };
    }
}

