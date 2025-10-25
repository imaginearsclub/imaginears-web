/**
 * Session & Activity Export
 * 
 * Export session data and activity logs in various formats:
 * - CSV
 * - JSON
 * - Excel (XLSX)
 * - PDF reports
 */

import { prisma } from './prisma';

export interface ExportOptions {
  userId: string;
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  includeActivities: boolean;
  includeSuspicious: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Export user sessions to CSV
 */
export async function exportSessionsCSV(options: ExportOptions): Promise<string> {
  const { userId, includeActivities, includeSuspicious, dateFrom, dateTo } = options;
  
  // Build query
  const where: any = { userId };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  if (includeSuspicious === false) {
    where.isSuspicious = false;
  }
  
  const sessions = await prisma.session.findMany({
    where,
    include: {
      activities: includeActivities,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Generate CSV header
  const headers = [
    'Session ID',
    'Created At',
    'Last Activity',
    'Expires At',
    'Device Name',
    'Device Type',
    'Browser',
    'OS',
    'IP Address',
    'Country',
    'City',
    'Trust Level',
    'Is Suspicious',
    'Login Method',
    'Is Remember Me',
  ];
  
  if (includeActivities) {
    headers.push('Total Activities', 'Suspicious Activities', 'Errors');
  }
  
  // Generate CSV rows
  const rows = sessions.map(session => {
    const row = [
      session.id,
      session.createdAt.toISOString(),
      session.lastActivityAt.toISOString(),
      session.expiresAt.toISOString(),
      session.deviceName || '',
      session.deviceType || '',
      session.browser || '',
      session.os || '',
      session.ipAddress || '',
      session.country || '',
      session.city || '',
      session.trustLevel.toString(),
      session.isSuspicious ? 'Yes' : 'No',
      session.loginMethod || '',
      session.isRememberMe ? 'Yes' : 'No',
    ];
    
    if (includeActivities && 'activities' in session) {
      const activities = session.activities as any[];
      row.push(
        activities.length.toString(),
        activities.filter(a => a.isSuspicious).length.toString(),
        activities.filter(a => a.isError).length.toString()
      );
    }
    
    return row;
  });
  
  // Combine into CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');
  
  return csv;
}

/**
 * Export session activities to CSV
 */
export async function exportActivitiesCSV(options: ExportOptions): Promise<string> {
  const { userId, includeSuspicious, dateFrom, dateTo } = options;
  
  // Build query
  const where: any = {
    session: { userId },
  };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  if (includeSuspicious === false) {
    where.isSuspicious = false;
  }
  
  const activities = await prisma.sessionActivity.findMany({
    where,
    include: {
      session: {
        select: {
          deviceName: true,
          country: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Generate CSV header
  const headers = [
    'Activity ID',
    'Session ID',
    'Created At',
    'Action',
    'Endpoint',
    'Method',
    'Status Code',
    'Duration (ms)',
    'Device',
    'Location',
    'IP Address',
    'Is Error',
    'Is Suspicious',
  ];
  
  // Generate CSV rows
  const rows = activities.map(activity => [
    activity.id,
    activity.sessionId,
    activity.createdAt.toISOString(),
    activity.action,
    activity.endpoint || '',
    activity.method || '',
    activity.statusCode?.toString() || '',
    activity.duration?.toString() || '',
    activity.session.deviceName || '',
    `${activity.session.city || ''}, ${activity.session.country || ''}`.trim().replace(/^,\s*/, ''),
    activity.ipAddress || '',
    activity.isError ? 'Yes' : 'No',
    activity.isSuspicious ? 'Yes' : 'No',
  ]);
  
  // Combine into CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');
  
  return csv;
}

/**
 * Export sessions to JSON
 */
export async function exportSessionsJSON(options: ExportOptions): Promise<string> {
  const { userId, includeActivities, includeSuspicious, dateFrom, dateTo } = options;
  
  const where: any = { userId };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  if (includeSuspicious === false) {
    where.isSuspicious = false;
  }
  
  const sessions = await prisma.session.findMany({
    where,
    include: {
      activities: includeActivities,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    totalSessions: sessions.length,
    sessions: sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      device: {
        name: session.deviceName,
        type: session.deviceType,
        browser: session.browser,
        os: session.os,
      },
      location: {
        ip: session.ipAddress,
        country: session.country,
        city: session.city,
      },
      security: {
        trustLevel: session.trustLevel,
        isSuspicious: session.isSuspicious,
        loginMethod: session.loginMethod,
        isRememberMe: session.isRememberMe,
      },
      activities: includeActivities && 'activities' in session
        ? (session.activities as any[]).map(activity => ({
            id: activity.id,
            createdAt: activity.createdAt,
            action: activity.action,
            endpoint: activity.endpoint,
            method: activity.method,
            statusCode: activity.statusCode,
            duration: activity.duration,
            isError: activity.isError,
            isSuspicious: activity.isSuspicious,
          }))
        : undefined,
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Export sessions to PDF report (simplified)
 */
export async function exportSessionsPDF(options: ExportOptions): Promise<string> {
  // In production, use a PDF library like pdfkit or puppeteer
  // For now, return a formatted text report
  
  const { userId, includeActivities, dateFrom, dateTo } = options;
  
  const where: any = { userId };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  
  const sessions = await prisma.session.findMany({
    where,
    include: {
      activities: includeActivities,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  
  // Generate report text
  let report = `
SESSION SECURITY REPORT
=======================

Generated: ${new Date().toLocaleString()}
User: ${user?.name || 'Unknown'} (${user?.email || 'Unknown'})
Period: ${dateFrom?.toLocaleDateString() || 'All time'} - ${dateTo?.toLocaleDateString() || 'Now'}
Total Sessions: ${sessions.length}

SESSIONS
--------

`;
  
  sessions.forEach((session, index) => {
    report += `
${index + 1}. Session ${session.id}
   Created: ${session.createdAt.toLocaleString()}
   Last Activity: ${session.lastActivityAt.toLocaleString()}
   Device: ${session.deviceName || 'Unknown'} (${session.deviceType || 'Unknown'})
   Browser: ${session.browser || 'Unknown'}
   OS: ${session.os || 'Unknown'}
   Location: ${session.city || 'Unknown'}, ${session.country || 'Unknown'}
   IP: ${session.ipAddress || 'Unknown'}
   Trust Level: ${session.trustLevel}
   Status: ${session.isSuspicious ? '⚠️ SUSPICIOUS' : '✅ Normal'}
`;
    
    if (includeActivities && 'activities' in session) {
      const activities = session.activities as any[];
      report += `   Activities: ${activities.length} (${activities.filter(a => a.isError).length} errors, ${activities.filter(a => a.isSuspicious).length} suspicious)\n`;
    }
  });
  
  report += `
SUMMARY
-------

Active Sessions: ${sessions.filter(s => s.expiresAt > new Date()).length}
Expired Sessions: ${sessions.filter(s => s.expiresAt <= new Date()).length}
Suspicious Sessions: ${sessions.filter(s => s.isSuspicious).length}
Unique Devices: ${new Set(sessions.map(s => s.deviceName)).size}
Unique Locations: ${new Set(sessions.map(s => `${s.country}-${s.city}`)).size}

Trust Level Distribution:
- New (0): ${sessions.filter(s => s.trustLevel === 0).length}
- Recognized (1): ${sessions.filter(s => s.trustLevel === 1).length}
- Trusted (2): ${sessions.filter(s => s.trustLevel === 2).length}

=======================
End of Report
`;
  
  return report;
}

/**
 * Main export function - delegates to format-specific functions
 */
export async function exportSessions(options: ExportOptions): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  let data: string;
  let extension: string;
  let contentType: string;
  
  switch (options.format) {
    case 'csv':
      data = await exportSessionsCSV(options);
      extension = 'csv';
      contentType = 'text/csv';
      break;
    
    case 'json':
      data = await exportSessionsJSON(options);
      extension = 'json';
      contentType = 'application/json';
      break;
    
    case 'pdf':
      data = await exportSessionsPDF(options);
      extension = 'pdf';
      contentType = 'application/pdf';
      break;
    
    case 'xlsx':
      // In production, use exceljs or similar library
      data = await exportSessionsCSV(options);
      extension = 'csv'; // Fallback to CSV
      contentType = 'text/csv';
      break;
    
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `sessions-export-${timestamp}.${extension}`;
  
  return {
    data,
    filename,
    contentType,
  };
}

/**
 * Export activity logs
 */
export async function exportActivities(options: ExportOptions): Promise<{
  data: string;
  filename: string;
  contentType: string;
}> {
  let data: string;
  let extension: string;
  let contentType: string;
  
  switch (options.format) {
    case 'csv':
      data = await exportActivitiesCSV(options);
      extension = 'csv';
      contentType = 'text/csv';
      break;
    
    case 'json':
      // Similar to sessions JSON export
      data = await exportSessionsJSON({
        ...options,
        includeActivities: true,
      });
      extension = 'json';
      contentType = 'application/json';
      break;
    
    default:
      data = await exportActivitiesCSV(options);
      extension = 'csv';
      contentType = 'text/csv';
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `activities-export-${timestamp}.${extension}`;
  
  return {
    data,
    filename,
    contentType,
  };
}

/**
 * Helper: Escape CSV values
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate audit trail export (immutable log)
 */
export async function exportAuditTrail(options: ExportOptions): Promise<string> {
  const { userId, dateFrom, dateTo } = options;
  
  const where: any = {
    session: { userId },
  };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }
  
  const activities = await prisma.sessionActivity.findMany({
    where,
    include: {
      session: {
        select: {
          deviceName: true,
          ipAddress: true,
          country: true,
          city: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' }, // Chronological for audit
  });
  
  // Generate audit log format
  const auditLog = activities.map((activity, index) => {
    const entry = {
      sequence: index + 1,
      timestamp: activity.createdAt.toISOString(),
      sessionId: activity.sessionId,
      action: activity.action,
      endpoint: activity.endpoint,
      method: activity.method,
      statusCode: activity.statusCode,
      duration: activity.duration,
      device: activity.session.deviceName,
      location: `${activity.session.city}, ${activity.session.country}`,
      ip: activity.session.ipAddress,
      flags: {
        error: activity.isError,
        suspicious: activity.isSuspicious,
      },
      // Hash for integrity (in production, use proper cryptographic hash)
      checksum: Buffer.from(
        `${activity.id}:${activity.createdAt.getTime()}`
      ).toString('base64'),
    };
    
    return JSON.stringify(entry);
  }).join('\n');
  
  return auditLog;
}

