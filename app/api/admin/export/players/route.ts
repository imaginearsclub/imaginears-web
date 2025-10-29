import { NextResponse } from "next/server";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from "@/lib/exports";
import { log } from "@/lib/logger";
import { logDataExported } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";
import { z } from "zod";

// Security: Constants for validation
const MAX_EXPORT_RECORDS = 10000; // Prevent excessive exports

// Validation schema for query parameters
const exportQuerySchema = z.object({
    format: z.enum(["csv", "excel", "pdf"]).default("csv"),
    days: z.coerce.number().int().min(1).max(365).default(30),
});

type ExportQuery = z.infer<typeof exportQuerySchema>;

/**
 * Generate export response based on format
 */
function generateExport(
  format: string,
  formattedData: unknown[],
  filename: string,
  days: number,
  userId: string
): NextResponse {
  const columns = [
    { key: "minecraftName", label: "Minecraft Name" },
    { key: "totalWebVisits", label: "Web Visits" },
    { key: "totalMinecraftTime", label: "Playtime (minutes)" },
    { key: "totalMinecraftJoins", label: "Joins" },
    { key: "overallEngagement", label: "Engagement %" },
    { key: "lastActiveAt", label: "Last Active" },
  ];

  switch (format) {
    case "csv": {
      const csv = exportToCSV(formattedData, filename, columns);
      log.info("Player CSV export completed", { userId, filename });
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    case "excel": {
      const excel = exportToExcel(formattedData, filename, "Player Analytics", columns);
      log.info("Player Excel export completed", { userId, filename });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new NextResponse(excel as any, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    case "pdf": {
      const pdf = exportToPDF(formattedData, filename, "Player Analytics Report", columns, {
        subtitle: `Active players in the last ${days} days`,
        dateRange: `${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
      });
      log.info("Player PDF export completed", { userId, filename });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new NextResponse(pdf as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "no-store, must-revalidate",
        },
      });
    }

    default:
      log.warn("Invalid export format requested", { userId, format });
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }
}

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
      take: MAX_EXPORT_RECORDS, // Security: Prevent excessive exports
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
    return generateExport(format, formattedData, filename, days, userId!)
  }
);

