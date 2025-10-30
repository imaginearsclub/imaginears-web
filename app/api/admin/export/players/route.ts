import { NextResponse } from "next/server";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { formatDataForExport } from "@/lib/exports";
import { log } from "@/lib/logger";
import { logDataExported } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";
import {
  exportQuerySchema,
  generateExportResponse,
  generateDateRange,
  EXPORT_CONSTANTS,
  type ExportQuery,
  type ExportColumn,
} from "../utils";

/**
 * Player analytics export columns
 */
const PLAYER_COLUMNS: ExportColumn[] = [
  { key: "minecraftName", label: "Minecraft Name" },
  { key: "totalWebVisits", label: "Web Visits" },
  { key: "totalMinecraftTime", label: "Playtime (minutes)" },
  { key: "totalMinecraftJoins", label: "Joins" },
  { key: "overallEngagement", label: "Engagement %" },
  { key: "lastActiveAt", label: "Last Active" },
];

/**
 * GET /api/admin/export/players
 * Export player analytics data
 * 
 * Security:
 * - Requires authentication and analytics:export permission
 * - Rate limited (10 exports per hour)
 * - Input validation with Zod
 * - Audit logging for data exports
 * - Maximum record limits
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "export:players",
      limit: 10, // Max 10 exports per hour per user
      window: 3600, // 1 hour
      strategy: "sliding-window",
    },
    validateQuery: exportQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const { format, days } = validatedQuery as ExportQuery;

    // Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { role: true, email: true },
    });

    if (!user) {
      log.warn("User not found for export", { userId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission
    if (!(await userHasPermissionAsync(user.role, "analytics:export"))) {
      log.warn("Player export permission denied", { userId, role: user.role });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch player analytics data with security limit
    const players = await prisma.playerAnalytics.findMany({
      where: {
        lastActiveAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { totalMinecraftTime: "desc" },
      take: EXPORT_CONSTANTS.MAX_PLAYERS_RECORDS,
    });

    // Format data
    const formattedData = formatDataForExport(players);
    const filename = `players-export-${new Date().toISOString().split("T")[0]}`;
    
    log.info("Player analytics export initiated", {
      userId,
      format,
      days,
      recordCount: players.length,
    });

    // Audit log
    logDataExported(
      "player_analytics",
      userId!,
      user.email || '',
      {
        format,
        days,
        recordCount: players.length,
        filename,
      }
    );

    // Generate and return export
    return generateExportResponse({
      format,
      formattedData,
      filename,
      columns: PLAYER_COLUMNS,
      userId: userId!,
      exportType: "Player Analytics",
      pdfOptions: {
        subtitle: `Active players in the last ${days} days`,
        dateRange: generateDateRange(days),
      },
    });
  }
);