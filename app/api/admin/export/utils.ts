/**
 * Shared utilities for export endpoints
 * 
 * Implements DRY principles for data export operations
 */

import { NextResponse } from "next/server";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/exports";
import { log } from "@/lib/logger";
import { z } from "zod";

/**
 * Export constants
 */
export const EXPORT_CONSTANTS = {
  MAX_PLAYERS_RECORDS: 10000,
  MAX_SYNC_HISTORY_RECORDS: 5000,
  DEFAULT_DAYS: 30,
  MAX_DAYS: 365,
} as const;

/**
 * Export format enum
 */
export const ExportFormat = ["csv", "excel", "pdf"] as const;

/**
 * Export column definition
 */
export interface ExportColumn {
  key: string;
  label: string;
}

/**
 * Export query validation schema
 */
export const exportQuerySchema = z.object({
  format: z.enum(ExportFormat).default("csv"),
  days: z.coerce.number().int().min(1).max(EXPORT_CONSTANTS.MAX_DAYS).default(EXPORT_CONSTANTS.DEFAULT_DAYS),
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;

/**
 * Export options for PDF
 */
export interface PDFExportOptions {
  subtitle?: string;
  dateRange?: string;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  format: string;
  formattedData: unknown[];
  filename: string;
  columns: ExportColumn[];
  userId: string;
  exportType: string;
  pdfOptions?: PDFExportOptions;
}

/**
 * Generate export response based on format
 */
export function generateExportResponse(config: ExportConfig): NextResponse {
  const { format, formattedData, filename, columns, userId, exportType, pdfOptions } = config;
  switch (format) {
    case "csv": {
      const csv = exportToCSV(formattedData, filename, columns);
      log.info(`${exportType} CSV export completed`, { userId, filename });
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
      const excel = exportToExcel(formattedData, filename, `${exportType}`, columns);
      log.info(`${exportType} Excel export completed`, { userId, filename });
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
      const pdf = exportToPDF(
        formattedData,
        filename,
        `${exportType} Report`,
        columns,
        pdfOptions
      );
      log.info(`${exportType} PDF export completed`, { userId, filename });
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
 * Generate date range string for PDF subtitles
 */
export function generateDateRange(days: number): string {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return `${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
}