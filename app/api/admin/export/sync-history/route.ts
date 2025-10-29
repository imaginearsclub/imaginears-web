import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { exportToCSV, exportToExcel, exportToPDF, formatDataForExport } from "@/lib/exports";
import { log } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limiter";
import { sanitizeInput } from "@/lib/input-sanitization";
import { logDataExported } from "@/lib/audit-logger";

// Security: Constants for validation
const VALID_FORMATS = ["csv", "excel", "pdf"];
const MIN_DAYS = 1;
const MAX_DAYS = 365; // Max 1 year
const DEFAULT_DAYS = 30;
const MAX_EXPORT_RECORDS = 5000; // Prevent excessive exports

// Security: Rate limit configuration for exports
const EXPORT_RATE_LIMIT = {
    key: "export:sync-history",
    limit: 15, // Max 15 exports per hour per user
    window: 3600, // 1 hour
    strategy: "sliding-window" as const,
};

/**
 * GET /api/admin/export/sync-history
 * Export sync history data
 * 
 * Security:
 * - Requires authentication and analytics:export permission
 * - Rate limited (15 exports per hour)
 * - Input validation and sanitization
 * - Audit logging for data exports
 * - Maximum record limits
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      log.warn("Unauthorized sync history export access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Security: Rate limiting for exports
    const rateLimitResult = await rateLimit(userId, EXPORT_RATE_LIMIT);
    
    if (!rateLimitResult.allowed) {
      log.warn("Sync history export rate limit exceeded", { 
        userId, 
        remaining: rateLimitResult.remaining 
      });
      return NextResponse.json(
        { error: "Too many export requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetAfter.toString(),
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          }
        }
      );
    }

    // Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
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

    const { searchParams } = new URL(req.url);
    
    // Security: Validate format parameter
    const formatParam = searchParams.get("format");
    const format = formatParam && VALID_FORMATS.includes(formatParam) 
      ? sanitizeInput(formatParam, 10)
      : "csv";
    
    // Security: Validate days parameter
    const daysParam = searchParams.get("days");
    const days = daysParam 
      ? Math.min(Math.max(parseInt(daysParam, 10) || DEFAULT_DAYS, MIN_DAYS), MAX_DAYS)
      : DEFAULT_DAYS;

    // Fetch sync history with security limit
    const history = await prisma.syncHistory.findMany({
      where: {
        startedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startedAt: "desc" },
      take: MAX_EXPORT_RECORDS, // Security: Prevent excessive exports
    });

    // Format data
    const formattedData = formatDataForExport(history);
    
    log.info("Sync history export initiated", {
      userId,
      format,
      days,
      recordCount: history.length,
    });

    // Define columns
    const columns = [
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

    // Security: Sanitize filename
    const filename = `sync-history-${new Date().toISOString().split("T")[0]}`;

    // Audit log
    logDataExported(
      "sync_history",
      userId,
      session.user.email || '',
      {
        format,
        days,
        recordCount: history.length,
        filename,
      }
    );

    // Generate export based on format
    switch (format) {
      case "csv": {
        const csv = exportToCSV(formattedData, filename, columns);
        
        log.info("Sync history CSV export completed", { userId, filename });
        
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
        const excel = await exportToExcel(formattedData, filename, "Sync History", columns);
        
        log.info("Sync history Excel export completed", { userId, filename });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new NextResponse(excel as any, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store, must-revalidate",
          },
        });
      }

      case "pdf": {
        const pdf = exportToPDF(formattedData, filename, "Sync History Report", columns, {
          subtitle: `Sync operations from the last ${days} days`,
          dateRange: `${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
        });
        
        log.info("Sync history PDF export completed", { userId, filename });
        
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
  } catch (error) {
    log.error("Sync history export failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to export sync history" },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        }
      }
    );
  }
}

