import { getServerSession } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * Lightweight session validation endpoint for middleware.
 * Returns 200 if session is valid, 401 if not.
 */
export async function GET() {
    try {
        const session = await getServerSession();
        
        if (!session?.user?.id) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }
        
        return NextResponse.json({ valid: true, userId: session.user.id });
    } catch (error) {
        console.error("[Session Check] Error:", error);
        return NextResponse.json({ valid: false }, { status: 401 });
    }
}

