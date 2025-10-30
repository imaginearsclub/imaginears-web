/**
 * Zod validation schemas for Events API
 */

import { z } from 'zod';
import { EventCategory, EventStatus, RecurrenceFreq } from '@prisma/client';

/**
 * Enum schemas based on Prisma types
 */
export const EventCategorySchema = z.enum([
  'Fireworks',
  'SeasonalOverlay',
  'MeetAndGreet',
  'Parade',
  'Other',
] as const satisfies readonly EventCategory[]);

export const EventStatusSchema = z.enum([
  'Draft',
  'Published',
  'Archived',
] as const satisfies readonly EventStatus[]);

export const RecurrenceFreqSchema = z.enum([
  'NONE',
  'DAILY',
  'WEEKLY',
] as const satisfies readonly RecurrenceFreq[]);

/**
 * Timezone validation - checks if valid IANA timezone
 */
export const TimezoneSchema = z
  .string()
  .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid timezone format')
  .refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid timezone' }
  )
  .default('America/New_York');

/**
 * Date validation - ensures valid date between 1970-2100
 */
export const DateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .transform((val) => new Date(val))
  .refine(
    (date) => {
      const year = date.getFullYear();
      return year >= 1970 && year <= 2100;
    },
    { message: 'Date must be between 1970 and 2100' }
  );

/**
 * Optional date validation (allows null)
 */
export const OptionalDateSchema = z
  .string()
  .datetime({ message: 'Invalid date format' })
  .transform((val) => new Date(val))
  .refine(
    (date) => {
      const year = date.getFullYear();
      return year >= 1970 && year <= 2100;
    },
    { message: 'Date must be between 1970 and 2100' }
  )
  .nullable()
  .optional();

/**
 * Time format validation (HH:MM)
 */
export const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format');

/**
 * Weekday validation (0-6, Sunday-Saturday)
 */
export const WeekdaySchema = z.number().int().min(0).max(6);

/**
 * POST /api/events - Create Event
 */
export const CreateEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    world: z.string().min(2, 'World must be at least 2 characters').max(100),
    shortDescription: z.string().max(500).nullable().optional(),
    details: z.string().max(50000).nullable().optional(),
    category: EventCategorySchema.default('Other'),
    status: EventStatusSchema.default('Draft'),
    startAt: DateSchema,
    endAt: DateSchema,
    timezone: TimezoneSchema,
    recurrenceFreq: RecurrenceFreqSchema.default('NONE'),
    byWeekday: z.array(WeekdaySchema).max(7).nullable().optional(),
    times: z.array(TimeSchema).max(10).nullable().optional(),
    recurrenceUntil: OptionalDateSchema,
  })
  .refine((data) => data.endAt > data.startAt, {
    message: 'End date must be after start date',
    path: ['endAt'],
  });

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

/**
 * PATCH /api/events/[id] - Update Event
 */
export const UpdateEventSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    world: z.string().min(2).max(100).optional(),
    shortDescription: z.string().max(500).nullable().optional(),
    details: z.string().max(50000).nullable().optional(),
    category: EventCategorySchema.optional(),
    status: EventStatusSchema.optional(),
    startAt: DateSchema.optional(),
    endAt: DateSchema.optional(),
    timezone: TimezoneSchema.optional(),
    recurrenceFreq: RecurrenceFreqSchema.optional(),
    byWeekday: z.array(WeekdaySchema).max(7).nullable().optional(),
    times: z.array(TimeSchema).max(10).nullable().optional(),
    recurrenceUntil: OptionalDateSchema,
  })
  .refine(
    (data) => {
      // If both dates provided, end must be after start
      if (data.startAt && data.endAt) {
        return data.endAt > data.startAt;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endAt'],
    }
  );

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

/**
 * GET /api/events - List Events Query
 */
export const ListEventsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1))
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100).default(50)),
  status: EventStatusSchema.optional(),
  category: EventCategorySchema.optional(),
});

export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>;

/**
 * GET /api/events/public - Public Events Query
 */
export const PublicEventsQuerySchema = z.object({
  status: EventStatusSchema.optional().default('Published'),
  category: EventCategorySchema.optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100).default(50)),
  cursor: z.string().max(50).optional(),
});

export type PublicEventsQuery = z.infer<typeof PublicEventsQuerySchema>;

/**
 * GET /api/events/running - Running Events Query
 */
export const RunningEventsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 3))
    .pipe(z.number().int().min(1).max(50).default(3)),
});

export type RunningEventsQuery = z.infer<typeof RunningEventsQuerySchema>;

/**
 * GET /api/events/public/upcoming - Upcoming Events Query
 */
export const UpcomingEventsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 14))
    .pipe(z.number().int().min(1).max(90).default(14)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 200))
    .pipe(z.number().int().min(1).max(500).default(200)),
});

export type UpcomingEventsQuery = z.infer<typeof UpcomingEventsQuerySchema>;

/**
 * Route parameter validation
 */
export const EventIdSchema = z.object({
  id: z.string().max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid event ID format'),
});

export type EventIdParam = z.infer<typeof EventIdSchema>;

