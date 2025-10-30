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
 * Sync history export columns
 */
const SYNC_HISTORY_COLUMNS: ExportColumn[] = [
  { key: "status", label: "Status" },
  { key: "startedAt", label: "Started At" },
  { key: "completedAt", label: "Completed At" },
  { key: "duration", label: "Duration (seconds)" },
  { key: "playerssynced", label: "Players Synced" },
  { key: "playersLinked", label: "Players Linked" },
  { key: "errors", label: "Errors" },
  { key: "triggeredBy", label: "Triggered By" },
  { key: "errorMessage", label: "Error Message" },
];

/**
 * GET /api/admin/export/sync-history
 * Export sync history data
 * 
 * Security:
 * - Requires authentication and analytics:export permission
 * - Rate limited (15 exports per hour)
 * - Input validation with Zod
 * - Audit logging for data exports
 * - Maximum record limits
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "export:sync-history",
      limit: 15, // Max 15 exports per hour per user
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
      log.warn("Sync history export permission denied", { userId, role: user.role });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch sync history with security limit
    const history = await prisma.syncHistory.findMany({
      where: {
        startedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startedAt: "desc" },
      take: EXPORT_CONSTANTS.MAX_SYNC_HISTORY_RECORDS,
    });

    // Format data
    const formattedData = formatDataForExport(history);
    const filename = `sync-history-${new Date().toISOString().split("T")[0]}`;
    
    log.info("Sync history export initiated", {
      userId,
      format,
      days,
      recordCount: history.length,
    });

    // Audit log
    logDataExported(
      "sync_history",
      userId!,
      user.email || '',
      {
        format,
        days,
        recordCount: history.length,
        filename,
      }
    );

    // Generate and return export
    return generateExportResponse({
      format,
      formattedData,
      filename,
      columns: SYNC_HISTORY_COLUMNS,
      userId: userId!,
      exportType: "Sync History",
      pdfOptions: {
        subtitle: `Sync operations from the last ${days} days`,
        dateRange: generateDateRange(days),
      },
    });
  }
);