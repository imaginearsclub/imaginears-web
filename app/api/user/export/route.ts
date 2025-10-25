import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * GDPR Data Export
 * Allows users to export all their personal data in JSON format
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          select: {
            providerId: true,
            accountId: true,
            createdAt: true,
          },
        },
        sessions: {
          select: {
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
          },
        },
        createdEvents: {
          select: {
            id: true,
            title: true,
            world: true,
            startAt: true,
            endAt: true,
            category: true,
            createdAt: true,
          },
        },
        updatedEvents: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },
        },
        createdApplications: {
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
        updatedApplications: {
          select: {
            id: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Remove sensitive fields
    const exportData = {
      ...userData,
      // Remove encrypted/sensitive data from export
      twoFactorSecret: undefined,
      backupCodes: undefined,
      accounts: userData.accounts.map(acc => ({
        ...acc,
        // Don't export OAuth tokens
      })),
      sessions: userData.sessions.map(sess => ({
        ...sess,
        // Remove full IP for privacy
        ipAddress: sess.ipAddress ? sess.ipAddress.substring(0, 10) + "..." : null,
      })),
      exportedAt: new Date().toISOString(),
      exportFormat: "JSON",
      gdprCompliance: true,
    };

    // Return as downloadable JSON
    const fileName = `imaginears-data-${session.user.id}-${Date.now()}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[DataExport] Error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

