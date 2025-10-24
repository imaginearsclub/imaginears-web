import { NextRequest, NextResponse } from "next/server";
import { isMaintenanceMode } from "@/lib/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Check if the site is in maintenance mode
 * Called by middleware to determine if user should see maintenance page
 */
export async function GET(req: NextRequest) {
    try {
        // Get user IP for allowlist checking
        const forwardedFor = req.headers.get("x-forwarded-for");
        const realIP = req.headers.get("x-real-ip");
        const userIP = forwardedFor ? forwardedFor.split(",")[0]?.trim() : realIP || "";

        const inMaintenanceMode = await isMaintenanceMode(userIP);

        return NextResponse.json({ 
            maintenance: inMaintenanceMode,
            ip: userIP 
        });
    } catch (error) {
        console.error("[Maintenance Check] Error:", error);
        // On error, don't block access
        return NextResponse.json({ maintenance: false });
    }
}

