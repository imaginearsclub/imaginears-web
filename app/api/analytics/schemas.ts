/**
 * Validation Schemas for Analytics API
 * 
 * Comprehensive Zod schemas for validating analytics operations
 */

import { z } from 'zod';

/**
 * Valid analytics periods
 */
export const AnalyticsPeriod = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
} as const;

export type AnalyticsPeriodValue = (typeof AnalyticsPeriod)[keyof typeof AnalyticsPeriod];

/**
 * Valid event types for tracking
 */
export const TrackEventType = {
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  FORM_SUBMIT: 'form_submit',
  DOWNLOAD: 'download',
  CUSTOM: 'custom',
} as const;

export type TrackEventTypeValue = (typeof TrackEventType)[keyof typeof TrackEventType];

/**
 * Query schema for analytics overview
 */
export const analyticsOverviewQuerySchema = z.object({
  period: z
    .enum([
      AnalyticsPeriod.TODAY,
      AnalyticsPeriod.WEEK,
      AnalyticsPeriod.MONTH,
      AnalyticsPeriod.QUARTER,
      AnalyticsPeriod.YEAR,
    ])
    .default(AnalyticsPeriod.WEEK),
});

export type AnalyticsOverviewQuery = z.infer<typeof analyticsOverviewQuerySchema>;

/**
 * Query schema for user devices analytics
 */
export const userDevicesQuerySchema = z.object({
  days: z.coerce
    .number()
    .int('Days must be an integer')
    .min(1, 'Days must be at least 1')
    .max(365, 'Days cannot exceed 365')
    .default(30),
});

export type UserDevicesQuery = z.infer<typeof userDevicesQuerySchema>;

/**
 * Query schema for events analytics
 */
export const eventsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
});

export type EventsQuery = z.infer<typeof eventsQuerySchema>;

/**
 * Query schema for players analytics
 */
export const playersQuerySchema = z.object({
  days: z.coerce
    .number()
    .int('Days must be an integer')
    .min(1, 'Days must be at least 1')
    .max(365, 'Days cannot exceed 365')
    .default(30),
});

export type PlayersQuery = z.infer<typeof playersQuerySchema>;

/**
 * Schema for tracking events
 */
export const trackEventSchema = z.object({
  type: z.string().min(1, 'Event type is required'),
  path: z.string().optional(),
  eventName: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type TrackEvent = z.infer<typeof trackEventSchema>;

/**
 * Response types
 */
export interface AnalyticsOverviewResponse {
  period: AnalyticsPeriodValue;
  startDate: string;
  endDate: string;
  pageViews: Array<{ date: string; views: number }>;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number; uniqueVisitors: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number; percentage: number }>;
  geographicBreakdown: Array<{ country: string; count: number; percentage: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number; percentage: number }>;
  activePlayers: number;
  trends: {
    pageViews: number;
    uniqueVisitors: number;
    activePlayers: number;
    avgDailyViews: number;
  };
}

export interface UserDevicesResponse {
  period: string;
  totalSessions: number;
  totalTrustedDevices: number;
  browsers: Array<{ name: string; count: number; percentage: string }>;
  operatingSystems: Array<{ name: string; count: number; percentage: string }>;
  deviceTypes: Array<{ name: string; count: number; percentage: string }>;
  combinations: Array<{
    combination: string;
    browser: string;
    os: string;
    count: number;
    percentage: string;
  }>;
  trustedPlatforms: Array<{ name: string; count: number; percentage: string }>;
  trustedDeviceTypes: Array<{ name: string; count: number; percentage: string }>;
}

export interface EventsResponse {
  topEvents: Array<{
    eventId: string;
    eventTitle: string;
    category: string;
    startAt: string;
    totalViews: number;
    uniqueVisitors: number;
    totalClicks: number;
    favoriteCount: number;
  }>;
}

export interface PlayersResponse {
  activePlayers: Array<{
    id: string;
    userId: string | null;
    minecraftName: string;
    minecraftUuid: string;
    totalWebVisits: number;
    totalMinecraftTime: number;
    totalMinecraftJoins: number;
    webEngagementScore: number;
    mcEngagementScore: number;
    overallEngagement: number;
    lastActiveAt: string;
  }>;
  retention: unknown; // Type depends on getPlayerRetention return
  topPlayers: Array<{
    minecraftName: string;
    totalMinecraftTime: number;
    totalMinecraftJoins: number;
  }>;
}