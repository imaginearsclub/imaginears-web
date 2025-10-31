/**
 * Application Settings API
 * 
 * GET /api/admin/settings - Retrieve global application settings
 * PATCH /api/admin/settings - Update global application settings
 * 
 * Security: Admin-only access, rate limited, audit logged, input validated
 * Performance: Cached settings, optimized queries, efficient updates
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { sanitizeInput } from '@/lib/input-sanitization';
import { ensureAppSettings } from '@/lib/migrations/app-settings';
import crypto from 'node:crypto';
import { cache } from '@/lib/cache';
import { jsonOk, jsonError } from '../sessions/response';
import { settingsUpdateSchema, type SettingsUpdate } from './schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper: Ensure settings row exists (race-safe)
 * 
 * Memory Safety: Handles race conditions properly
 * Performance: Uses skipDuplicates for efficiency
 */
async function ensureSettingsExist() { return ensureAppSettings(prisma); }

/**
 * Helper: Sanitize markdown field
 */
function sanitizeMarkdownField(
  value: string | null | undefined,
  maxLength: number
): string | null {
  if (value === undefined) return undefined as unknown as null;
  if (!value) return null;
  return sanitizeInput(value, maxLength);
}

/**
 * Helper: Sanitize text fields
 */
function sanitizeTextFields(data: Partial<SettingsUpdate>): Partial<SettingsUpdate> {
  const result: Partial<SettingsUpdate> = {};

  if (data.siteName !== undefined) {
    result.siteName = sanitizeInput(data.siteName, 100);
  }

  if (data.homepageIntro !== undefined) {
    result.homepageIntro = sanitizeMarkdownField(data.homepageIntro, 5000);
  }

  if (data.footerMarkdown !== undefined) {
    result.footerMarkdown = sanitizeMarkdownField(data.footerMarkdown, 5000);
  }

  if (data.aboutMarkdown !== undefined) {
    result.aboutMarkdown = sanitizeMarkdownField(data.aboutMarkdown, 10000);
  }

  if (data.applicationsIntroMarkdown !== undefined) {
    result.applicationsIntroMarkdown = sanitizeMarkdownField(
      data.applicationsIntroMarkdown,
      5000
    );
  }

  return result;
}

/**
 * Helper: Copy structured data (already validated by Zod)
 */
function copyStructuredData(data: Partial<SettingsUpdate>): Partial<SettingsUpdate> {
  const result: Partial<SettingsUpdate> = {};

  if (data.timezone !== undefined) result.timezone = data.timezone;
  if (data.branding !== undefined) result.branding = data.branding;
  if (data.events !== undefined) result.events = data.events;
  if (data.applications !== undefined) result.applications = data.applications;
  if (data.social !== undefined) result.social = data.social;
  if (data.seo !== undefined) result.seo = data.seo;
  if (data.features !== undefined) result.features = data.features;
  if (data.notifications !== undefined) result.notifications = data.notifications;
  if (data.maintenance !== undefined) result.maintenance = data.maintenance;
  if (data.security !== undefined) result.security = data.security;

  return result;
}

/**
 * Helper: Sanitize all inputs to prevent XSS
 */
function sanitizeTextInputs(data: Partial<SettingsUpdate>): Partial<SettingsUpdate> {
  return {
    ...sanitizeTextFields(data),
    ...copyStructuredData(data),
  };
}

/**
 * Helper: Redact sensitive values for audit logs
 */
function redactIfSensitive(path: string, value: unknown): unknown {
  const sensitiveKeys = ['turnstileSiteKey', 'discordWebhookUrl', 'discordApplicationsWebhookUrl', 'discordEventsWebhookUrl'];
  if (sensitiveKeys.some((k) => path.endsWith(k))) {
    return value ? '***redacted***' : value;
  }
  return value;
}

/**
 * Helper: Safely stringify values for comparison
 */
function safeStringify(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

const ALLOWED_SETTING_FIELDS = new Set([
  'siteName',
  'timezone',
  'homepageIntro',
  'footerMarkdown',
  'aboutMarkdown',
  'applicationsIntroMarkdown',
  'branding',
  'events',
  'applications',
  'social',
  'seo',
  'features',
  'notifications',
  'maintenance',
  'security',
]);

/**
 * Helper: Compute field-level diffs for audit logging
 */
function computeSettingsDiff(
  current: unknown,
  updated: unknown,
  sanitized: Partial<SettingsUpdate>
): Array<{ path: string; from: unknown; to: unknown }> {
  const diffs: Array<{ path: string; from: unknown; to: unknown }> = [];
  const currentSafe = (current ?? {}) as Record<string, unknown>;
  const updatedSafe = (updated ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(sanitized)) {
    if (!ALLOWED_SETTING_FIELDS.has(key)) continue;
    // eslint-disable-next-line security/detect-object-injection
    const fromVal = Object.prototype.hasOwnProperty.call(currentSafe, key) ? currentSafe[key] : undefined;
    // eslint-disable-next-line security/detect-object-injection
    const toVal = Object.prototype.hasOwnProperty.call(updatedSafe, key) ? updatedSafe[key] : undefined;
    if (safeStringify(fromVal) !== safeStringify(toVal)) {
      diffs.push({ path: key, from: redactIfSensitive(key, fromVal), to: redactIfSensitive(key, toVal) });
    }
  }
  return diffs;
}

/**
 * GET /api/admin/settings
 * 
 * Retrieves global application settings
 * 
 * Security:
 * - Admin-only access
 * - Rate limited to 120 requests per minute
 * 
 * Performance:
 * - Fast single-record query
 * - Auto-creates if not exists
 */
export const GET = createApiHandler(
  {
    auth: 'admin',
    rateLimit: {
      key: 'settings:read',
      limit: 120, // Generous for admin UI
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      log.info('Settings retrieval requested', { userId });

      // Ensure settings exist and fetch them
      const settings = await ensureSettingsExist();

      // ETag support for conditional GET
      const payload = { success: true, data: settings } as const;
      const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
      const etag = `W/"${hash}"`;
      const ifNoneMatch = _req.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return NextResponse.json(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': 'private, max-age=60',
          },
        } as unknown as ResponseInit);
      }

      const duration = Date.now() - startTime;

      log.info('Settings retrieved successfully', {
        userId,
        duration,
      });

      return NextResponse.json(payload, {
        headers: {
          'X-Response-Time': `${duration}ms`,
          'ETag': etag,
          'Cache-Control': 'private, max-age=60',
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Settings retrieval failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        { error: 'Failed to load settings' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/admin/settings
 * 
 * Updates global application settings
 * 
 * Security:
 * - Admin-only access
 * - Rate limited to 30 updates per hour
 * - Input validation with Zod schemas
 * - XSS protection with input sanitization
 * - Comprehensive audit logging
 * 
 * Performance:
 * - Validates before database operation
 * - Efficient partial updates
 * - Duration monitoring
 */
export const PATCH = createApiHandler(
  {
    auth: 'admin',
    rateLimit: {
      key: 'settings:update',
      limit: 30, // Max 30 updates per hour
      window: 3600,
      strategy: 'sliding-window',
    },
    validateBody: settingsUpdateSchema,
    maxBodySize: 50_000, // 50KB max (generous for markdown content)
  },
  async (_req, { userId, validatedBody }) => {
    const startTime = Date.now();

    try {
      // Idempotency support
      const idemKey = _req.headers.get('idempotency-key');
      if (idemKey) {
        const prior = await cache.get<{ response: unknown }>(`idemp:settings:${idemKey}`);
        if (prior?.response) {
          return jsonOk(_req, prior.response, { headers: { 'X-Response-Time': '0ms', 'X-Idempotent-Replay': '1' } });
        }
      }

      // Extract validated data
      const updates = validatedBody as SettingsUpdate;

      log.info('Settings update requested', {
        userId,
        fields: Object.keys(updates),
      });

      // Ensure settings exist
      const current = await ensureSettingsExist();

      // Optimistic concurrency with If-Match (ETag of current payload)
      const currentPayload = { success: true, data: current } as const;
      const currentHash = crypto.createHash('sha1').update(JSON.stringify(currentPayload)).digest('hex');
      const currentEtag = `W/"${currentHash}"`;
      const ifMatch = _req.headers.get('if-match');
      if (ifMatch && ifMatch !== currentEtag) {
        return jsonError(_req, 'Precondition Failed', 412, { expected: currentEtag });
      }

      // Sanitize text inputs to prevent XSS
      const sanitizedUpdates = sanitizeTextInputs(updates);

      // Check if there are any actual updates
      if (Object.keys(sanitizedUpdates).length === 0) {
        log.warn('Settings update with no fields', { userId });
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        );
      }

      // Update settings
      const updatedSettings = await prisma.appSettings.update({
        where: { id: 'global' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: sanitizedUpdates as any,
      });

      const duration = Date.now() - startTime;

      // Performance: Log slow operations
      if (duration > 2000) {
        log.warn('Slow settings update', {
          userId,
          duration,
          fieldsUpdated: Object.keys(sanitizedUpdates).length,
        });
      }

      // Security: Comprehensive audit logging with field diff (redacted where needed)
      const diffs = computeSettingsDiff(current, updatedSettings, sanitizedUpdates);

      log.warn('Settings updated', {
        adminId: userId,
        duration,
        updatedFields: Object.keys(sanitizedUpdates),
        diffs,
        maintenanceModeChanged: sanitizedUpdates.maintenance !== undefined,
        maintenanceEnabled: sanitizedUpdates.maintenance?.enabled,
        securitySettingsChanged: sanitizedUpdates.security !== undefined,
        timestamp: new Date().toISOString(),
      });

      const responseBody = {
        success: true,
        message: `Successfully updated ${Object.keys(sanitizedUpdates).length} setting(s)`,
        data: updatedSettings,
      };

      if (idemKey) {
        await cache.set(`idemp:settings:${idemKey}`, { response: responseBody }, 60);
      }

      return jsonOk(_req, responseBody, { headers: { 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Settings update failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to update settings', 500);
    }
  }
);
