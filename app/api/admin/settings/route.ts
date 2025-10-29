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
import {
  settingsUpdateSchema,
  SETTINGS_DEFAULTS,
  type SettingsUpdate,
} from './schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper: Ensure settings row exists (race-safe)
 * 
 * Memory Safety: Handles race conditions properly
 * Performance: Uses skipDuplicates for efficiency
 */
async function ensureSettingsExist() {
  try {
    // Try to create with defaults (skipDuplicates handles race conditions)
    await prisma.appSettings.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: [SETTINGS_DEFAULTS as any],
      skipDuplicates: true,
    });

    // Fetch the settings
    let settings = await prisma.appSettings.findUnique({
      where: { id: 'global' },
    });

    // Fallback: if still not found, create it explicitly
    if (!settings) {
      log.warn('Settings not found after createMany, creating explicitly');
      settings = await prisma.appSettings.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: SETTINGS_DEFAULTS as any,
      });
    }

    return settings;
  } catch (error) {
    log.error('Failed to ensure settings exist', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

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

      const duration = Date.now() - startTime;

      log.info('Settings retrieved successfully', {
        userId,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          data: settings,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
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
      // Extract validated data
      const updates = validatedBody as SettingsUpdate;

      log.info('Settings update requested', {
        userId,
        fields: Object.keys(updates),
      });

      // Ensure settings exist
      await ensureSettingsExist();

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

      // Security: Comprehensive audit logging
      log.warn('Settings updated', {
        adminId: userId,
        duration,
        updatedFields: Object.keys(sanitizedUpdates),
        // Log sensitive field changes for audit
        maintenanceModeChanged: sanitizedUpdates.maintenance !== undefined,
        maintenanceEnabled: sanitizedUpdates.maintenance?.enabled,
        securitySettingsChanged: sanitizedUpdates.security !== undefined,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully updated ${Object.keys(sanitizedUpdates).length} setting(s)`,
          data: updatedSettings,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Settings update failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  }
);
