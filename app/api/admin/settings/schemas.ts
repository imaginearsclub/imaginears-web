/**
 * Validation Schemas for Settings API
 * 
 * Comprehensive Zod schemas for validating application settings
 */

import { z } from 'zod';
import IPCIDR from 'ip-cidr';

/**
 * Hex color validation
 */
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #3b82f6)');

/**
 * URL validation (allows empty strings)
 */
const urlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Empty is ok
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid URL or empty' }
  );

/**
 * Email validation (allows empty strings)
 */
const emailSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true; // Empty is ok
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    },
    { message: 'Must be a valid email address or empty' }
  );

/**
 * Timezone validation
 */
const VALID_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
] as const;

const timezoneSchema = z.enum(VALID_TIMEZONES, {
  message: 'Must be a valid IANA timezone',
});

/**
 * Twitter card types
 */
const twitterCardSchema = z.enum(
  ['summary', 'summary_large_image', 'app', 'player'],
  {
    message: 'Must be a valid Twitter card type',
  }
);

/**
 * Recurrence frequency for events
 */
const recurrenceFreqSchema = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'], {
  message: 'Must be NONE, DAILY, WEEKLY, or MONTHLY',
});

/**
 * IP address validation using ip-cidr library
 * Supports both IPv4 and IPv6 formats
 */
const ipAddressSchema = z
  .string()
  .refine(
    (val) => {
      try {
        // ip-cidr constructor throws if invalid
        // Accepts CIDR notation (192.168.1.0/24) or plain IPs (192.168.1.1)
        new IPCIDR(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid IPv4 or IPv6 address' }
  );

/**
 * Branding settings schema
 */
export const brandingSchema = z.object({
  logoUrl: urlSchema.optional(),
  bannerUrl: urlSchema.optional(),
  accentHex: hexColorSchema.optional(),
});

/**
 * Events settings schema
 */
export const eventsSchema = z.object({
  defaultCategory: z.string().min(1).max(50).optional(),
  recurrenceFreq: recurrenceFreqSchema.optional(),
  byWeekday: z.array(z.string()).optional(),
  times: z.array(z.string()).optional(),
});

/**
 * Applications settings schema
 */
export const applicationsSchema = z.object({
  turnstileSiteKey: z.string().max(200).optional(),
  allowApplications: z.boolean().optional(),
});

/**
 * Social media settings schema
 */
export const socialSchema = z.object({
  twitter: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  discord: z.string().max(200).optional(),
  youtube: z.string().max(200).optional(),
  facebook: z.string().max(200).optional(),
  tiktok: z.string().max(100).optional(),
});

/**
 * SEO settings schema
 */
export const seoSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  image: urlSchema.optional(),
  twitterCard: twitterCardSchema.optional(),
});

/**
 * Features settings schema
 */
export const featuresSchema = z.object({
  showEventsOnHome: z.boolean().optional(),
  showApplicationsOnHome: z.boolean().optional(),
});

/**
 * Notifications settings schema
 */
export const notificationsSchema = z.object({
  discordWebhookUrl: urlSchema.optional(),
  discordApplicationsWebhookUrl: urlSchema.optional(),
  discordEventsWebhookUrl: urlSchema.optional(),
  notifyOnNewApplication: z.boolean().optional(),
  notifyOnNewEvent: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  adminEmail: emailSchema.optional(),
});

/**
 * Maintenance settings schema
 */
export const maintenanceSchema = z.object({
  enabled: z.boolean().optional(),
  message: z.string().min(1).max(500).optional(),
  allowedIPs: z.array(ipAddressSchema).optional(),
});

/**
 * Security settings schema
 */
export const securitySchema = z.object({
  rateLimitEnabled: z.boolean().optional(),
  maxRequestsPerMinute: z
    .number()
    .int()
    .min(10, 'Must be at least 10')
    .max(1000, 'Must not exceed 1000')
    .optional(),
  requireEmailVerification: z.boolean().optional(),
});

/**
 * Full settings update schema
 */
export const settingsUpdateSchema = z.object({
  siteName: z
    .string()
    .trim()
    .min(1, 'Site name cannot be empty')
    .max(100, 'Site name must be 100 characters or less')
    .optional(),
  timezone: timezoneSchema.optional(),
  homepageIntro: z.string().max(5000).nullable().optional(),
  footerMarkdown: z.string().max(5000).nullable().optional(),
  aboutMarkdown: z.string().max(10000).nullable().optional(),
  applicationsIntroMarkdown: z.string().max(5000).nullable().optional(),
  branding: brandingSchema.optional(),
  events: eventsSchema.optional(),
  applications: applicationsSchema.optional(),
  social: socialSchema.optional(),
  seo: seoSchema.optional(),
  features: featuresSchema.optional(),
  notifications: notificationsSchema.optional(),
  maintenance: maintenanceSchema.optional(),
  security: securitySchema.optional(),
});

/**
 * Type exports
 */
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
export type BrandingSettings = z.infer<typeof brandingSchema>;
export type EventsSettings = z.infer<typeof eventsSchema>;
export type ApplicationsSettings = z.infer<typeof applicationsSchema>;
export type SocialSettings = z.infer<typeof socialSchema>;
export type SEOSettings = z.infer<typeof seoSchema>;
export type FeaturesSettings = z.infer<typeof featuresSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSchema>;
export type MaintenanceSettings = z.infer<typeof maintenanceSchema>;
export type SecuritySettings = z.infer<typeof securitySchema>;

/**
 * Default values for settings
 */
export const SETTINGS_DEFAULTS = {
  id: 'global',
  siteName: 'Imaginears',
  timezone: 'America/New_York' as const,
  homepageIntro: '',
  footerMarkdown: '',
  aboutMarkdown: '',
  applicationsIntroMarkdown: '',
  branding: { logoUrl: '', bannerUrl: '', accentHex: '#3b82f6' },
  events: {
    defaultCategory: 'Other',
    recurrenceFreq: 'NONE' as const,
    byWeekday: [] as string[],
    times: [] as string[],
  },
  applications: { turnstileSiteKey: '', allowApplications: true },
  social: {
    twitter: '',
    instagram: '',
    discord: '',
    youtube: '',
    facebook: '',
    tiktok: '',
  },
  seo: {
    title: '',
    description: '',
    image: '',
    twitterCard: 'summary_large_image' as const,
  },
  features: { showEventsOnHome: true, showApplicationsOnHome: true },
  notifications: {
    discordWebhookUrl: '',
    discordApplicationsWebhookUrl: '',
    discordEventsWebhookUrl: '',
    notifyOnNewApplication: true,
    notifyOnNewEvent: false,
    emailNotifications: false,
    adminEmail: '',
  },
  maintenance: {
    enabled: false,
    message: "We'll be back soon!",
    allowedIPs: [] as string[],
  },
  security: {
    rateLimitEnabled: true,
    maxRequestsPerMinute: 60,
    requireEmailVerification: false,
  },
};

