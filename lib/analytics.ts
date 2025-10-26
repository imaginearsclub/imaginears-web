import { prisma } from "./prisma";
import type { 
  AnalyticsEvent, 
  AnalyticsMetric, 
  PlayerAnalytics, 
  EventAnalytics,
  ApplicationAnalytics 
} from "@prisma/client";

/**
 * Analytics Library
 * 
 * Comprehensive analytics tracking and querying for:
 * - Page views and user actions
 * - Event performance
 * - Application metrics
 * - Player engagement (Web + Minecraft)
 */

// ============================================================================
// Event Tracking
// ============================================================================

export interface TrackEventInput {
  eventType: string; // "page_view", "button_click", "event_view", etc.
  eventName: string; // Friendly name
  userId?: string;
  sessionId?: string;
  anonymousId?: string;
  path: string;
  referrer?: string;
  urlParams?: Record<string, any>;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  properties?: Record<string, any>;
  duration?: number;
}

/**
 * Track an analytics event
 */
export async function trackEvent(input: TrackEventInput): Promise<AnalyticsEvent> {
  const event = await prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      eventName: input.eventName,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      anonymousId: input.anonymousId ?? null,
      path: input.path,
      referrer: input.referrer ?? null,
      urlParams: (input.urlParams as any) ?? null,
      deviceType: input.deviceType ?? null,
      browser: input.browser ?? null,
      os: input.os ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      properties: (input.properties as any) ?? null,
      duration: input.duration ?? null,
      timestamp: new Date(),
      date: new Date(),
    },
  });

  return event;
}

/**
 * Track page view
 */
export async function trackPageView(input: {
  path: string;
  userId?: string;
  sessionId?: string;
  referrer?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  duration?: number;
}): Promise<AnalyticsEvent> {
  return trackEvent({
    eventType: "page_view",
    eventName: `Page View: ${input.path}`,
    ...input,
  });
}

/**
 * Track button click or action
 */
export async function trackAction(input: {
  action: string; // "apply_button_click", "event_favorite", etc.
  label: string; // Friendly name
  userId?: string;
  sessionId?: string;
  path: string;
  properties?: Record<string, any>;
}): Promise<AnalyticsEvent> {
  return trackEvent({
    eventType: "action",
    eventName: input.label,
    userId: input.userId,
    sessionId: input.sessionId,
    path: input.path,
    properties: { action: input.action, ...input.properties },
  });
}

// ============================================================================
// Event Analytics
// ============================================================================

/**
 * Track event view
 */
export async function trackEventView(eventId: string, userId?: string): Promise<void> {
  // Create analytics event
  await trackEvent({
    eventType: "event_view",
    eventName: "Event Viewed",
    userId,
    path: `/events/${eventId}`,
    properties: { eventId },
  });

  // Update event analytics
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, category: true, startAt: true },
  });

  if (!event) return;

  await prisma.eventAnalytics.upsert({
    where: { eventId },
    create: {
      eventId,
      eventTitle: event.title,
      category: event.category,
      startAt: event.startAt,
      totalViews: 1,
      uniqueVisitors: 1,
    },
    update: {
      totalViews: { increment: 1 },
      uniqueVisitors: userId ? { increment: 1 } : undefined,
    },
  });
}

/**
 * Get event analytics
 */
export async function getEventAnalytics(eventId: string): Promise<EventAnalytics | null> {
  return await prisma.eventAnalytics.findUnique({
    where: { eventId },
  });
}

/**
 * Get top events by views
 */
export async function getTopEvents(limit: number = 10): Promise<EventAnalytics[]> {
  return await prisma.eventAnalytics.findMany({
    orderBy: { totalViews: "desc" },
    take: limit,
  });
}

// ============================================================================
// Player Analytics
// ============================================================================

/**
 * Update player web activity
 */
export async function updatePlayerWebActivity(userId: string): Promise<void> {
  await prisma.playerAnalytics.upsert({
    where: { userId },
    create: {
      userId,
      lastWebVisit: new Date(),
      totalWebVisits: 1,
      totalPageViews: 1,
      lastActiveAt: new Date(),
    },
    update: {
      lastWebVisit: new Date(),
      totalWebVisits: { increment: 1 },
      totalPageViews: { increment: 1 },
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Sync Minecraft player data (called from webhook or scheduled job)
 */
export async function syncMinecraftPlayerData(data: {
  minecraftUuid: string;
  minecraftName: string;
  totalPlaytime: number; // minutes
  totalJoins: number;
  lastJoin: Date;
  firstJoin: Date;
}): Promise<void> {
  await prisma.playerAnalytics.upsert({
    where: { minecraftUuid: data.minecraftUuid },
    create: {
      minecraftUuid: data.minecraftUuid,
      minecraftName: data.minecraftName,
      totalMinecraftTime: data.totalPlaytime,
      totalMinecraftJoins: data.totalJoins,
      lastMinecraftJoin: data.lastJoin,
      firstMinecraftJoin: data.firstJoin,
      lastActiveAt: data.lastJoin,
      mcEngagementScore: calculateMcEngagement(data.totalPlaytime, data.totalJoins),
    },
    update: {
      minecraftName: data.minecraftName,
      totalMinecraftTime: data.totalPlaytime,
      totalMinecraftJoins: data.totalJoins,
      lastMinecraftJoin: data.lastJoin,
      lastActiveAt: data.lastJoin,
      mcEngagementScore: calculateMcEngagement(data.totalPlaytime, data.totalJoins),
    },
  });
}

/**
 * Calculate Minecraft engagement score
 */
function calculateMcEngagement(totalMinutes: number, totalJoins: number): number {
  // Simple engagement formula (can be enhanced)
  const hoursPlayed = totalMinutes / 60;
  const score = Math.min(100, (hoursPlayed * 0.5) + (totalJoins * 2));
  return Math.round(score * 100) / 100;
}

/**
 * Get active players (last 30 days)
 */
export async function getActivePlayers(days: number = 30): Promise<PlayerAnalytics[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return await prisma.playerAnalytics.findMany({
    where: {
      lastActiveAt: { gte: since },
      isActive: true,
    },
    orderBy: { overallEngagement: "desc" },
  });
}

/**
 * Get player retention by cohort
 */
export async function getPlayerRetention(): Promise<
  Record<string, { total: number; active: number; retention: number }>
> {
  const cohorts = await prisma.playerAnalytics.groupBy({
    by: ["cohortMonth"],
    where: { cohortMonth: { not: null } },
    _count: true,
  });

  const result: Record<string, { total: number; active: number; retention: number }> = {};

  for (const cohort of cohorts) {
    if (!cohort.cohortMonth) continue;

    const active = await prisma.playerAnalytics.count({
      where: {
        cohortMonth: cohort.cohortMonth,
        isActive: true,
      },
    });

    result[cohort.cohortMonth] = {
      total: cohort._count,
      active,
      retention: (active / cohort._count) * 100,
    };
  }

  return result;
}

// ============================================================================
// Aggregated Metrics
// ============================================================================

/**
 * Record aggregated metric
 */
export async function recordMetric(input: {
  date: Date;
  hour?: number;
  period: "hourly" | "daily";
  metricType: string;
  category?: string;
  dimension?: string;
  value: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  await prisma.analyticsMetric.upsert({
    where: {
      date_hour_period_metricType_category_dimension: {
        date: input.date,
        hour: input.hour ?? null,
        period: input.period,
        metricType: input.metricType,
        category: input.category ?? null,
        dimension: input.dimension ?? null,
      },
    },
    create: {
      date: input.date,
      hour: input.hour ?? null,
      period: input.period,
      metricType: input.metricType,
      category: input.category ?? null,
      dimension: input.dimension ?? null,
      value: input.value,
      metadata: (input.metadata as any) ?? null,
    },
    update: {
      value: input.value,
      metadata: (input.metadata as any) ?? null,
    },
  });
}

/**
 * Get metrics for a date range
 */
export async function getMetrics(input: {
  metricType: string;
  startDate: Date;
  endDate: Date;
  category?: string;
  dimension?: string;
}): Promise<AnalyticsMetric[]> {
  return await prisma.analyticsMetric.findMany({
    where: {
      metricType: input.metricType,
      date: {
        gte: input.startDate,
        lte: input.endDate,
      },
      category: input.category ?? undefined,
      dimension: input.dimension ?? undefined,
    },
    orderBy: { date: "asc" },
  });
}

/**
 * Get page views over time
 */
export async function getPageViews(startDate: Date, endDate: Date): Promise<
  Array<{ date: string; views: number }>
> {
  const events = await prisma.analyticsEvent.groupBy({
    by: ["date"],
    where: {
      eventType: "page_view",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
  });

  return events.map((e) => ({
    date: e.date.toISOString().split("T")[0],
    views: e._count,
  }));
}

/**
 * Get unique visitors count
 */
export async function getUniqueVisitors(startDate: Date, endDate: Date): Promise<number> {
  const result = await prisma.analyticsEvent.findMany({
    where: {
      eventType: "page_view",
      date: {
        gte: startDate,
        lte: endDate,
      },
      userId: { not: null },
    },
    distinct: ["userId"],
    select: { userId: true },
  });

  return result.length;
}

/**
 * Get top pages by views
 */
export async function getTopPages(
  startDate: Date,
  endDate: Date,
  limit: number = 10
): Promise<Array<{ path: string; views: number }>> {
  const events = await prisma.analyticsEvent.groupBy({
    by: ["path"],
    where: {
      eventType: "page_view",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: true,
    orderBy: { _count: { path: "desc" } },
    take: limit,
  });

  return events.map((e) => ({
    path: e.path,
    views: e._count,
  }));
}

/**
 * Get device breakdown
 */
export async function getDeviceBreakdown(
  startDate: Date,
  endDate: Date
): Promise<Array<{ deviceType: string; count: number }>> {
  const events = await prisma.analyticsEvent.groupBy({
    by: ["deviceType"],
    where: {
      eventType: "page_view",
      date: {
        gte: startDate,
        lte: endDate,
      },
      deviceType: { not: null },
    },
    _count: true,
  });

  return events.map((e) => ({
    deviceType: e.deviceType || "unknown",
    count: e._count,
  }));
}

// ============================================================================
// Application Analytics
// ============================================================================

/**
 * Update application analytics (run daily)
 */
export async function updateApplicationAnalytics(date: Date): Promise<void> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get applications for the day
  const applications = await prisma.application.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  // Group by role and status
  const groups: Record<string, Record<string, any[]>> = {};

  for (const app of applications) {
    if (!groups[app.role]) groups[app.role] = {};
    if (!groups[app.role][app.status]) groups[app.role][app.status] = [];
    groups[app.role][app.status].push(app);
  }

  // Create analytics records
  for (const role of Object.keys(groups)) {
    for (const status of Object.keys(groups[role])) {
      const apps = groups[role][status];

      await prisma.applicationAnalytics.upsert({
        where: {
          date_role_status: {
            date: startOfDay,
            role,
            status,
          },
        },
        create: {
          date: startOfDay,
          role,
          status,
          totalApplications: apps.length,
          approvedApplications: apps.filter((a) => a.status === "Approved").length,
          rejectedApplications: apps.filter((a) => a.status === "Rejected").length,
        },
        update: {
          totalApplications: apps.length,
          approvedApplications: apps.filter((a) => a.status === "Approved").length,
          rejectedApplications: apps.filter((a) => a.status === "Rejected").length,
        },
      });
    }
  }
}

/**
 * Get application trends
 */
export async function getApplicationTrends(
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; total: number; approved: number; rejected: number }>> {
  const analytics = await prisma.applicationAnalytics.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      role: "all",
      status: "all",
    },
    orderBy: { date: "asc" },
  });

  return analytics.map((a) => ({
    date: a.date.toISOString().split("T")[0],
    total: a.totalApplications,
    approved: a.approvedApplications,
    rejected: a.rejectedApplications,
  }));
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get date range for common periods
 */
export function getDateRange(period: "today" | "week" | "month" | "quarter" | "year"): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate, endDate };
}

