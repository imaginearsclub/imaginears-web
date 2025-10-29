/**
 * Session Policies API
 * 
 * GET /api/admin/sessions/policies
 * Fetch current session policies
 * 
 * PUT /api/admin/sessions/policies
 * Update session policies
 * 
 * Security: Requires appropriate permissions, rate limited
 * Performance: 60-second cache for GET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";
import type { SessionPolicies } from "@/app/admin/sessions/policies/components/types";
import { createApiHandler } from "@/lib/api-middleware";
import { userHasPermissionAsync } from "@/lib/rbac-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 60 seconds (policies change infrequently)
const CACHE_SECONDS = 60;

/**
 * GET /api/admin/sessions/policies
 * 
 * Fetch current session policies configuration
 * 
 * Security: sessions:view_all permission check, rate limited
 * Performance: 60-second cache
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "sessions:policies:view",
      limit: 120, // Allow frequent policy checks
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user) {
        log.warn("Session policies view - user not found", { userId });
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // RBAC: Check sessions:view_all permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        "sessions:view_all"
      );

      if (!hasPermission) {
        log.warn("Session policies view - insufficient permissions", {
          userId,
          role: user.role,
        });
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }

      // Fetch policies from database (singleton record)
      let policies = await prisma.sessionPolicies.findFirst();

      // If no policies exist, create default ones
      if (!policies) {
        policies = await prisma.sessionPolicies.create({
          data: {
            maxConcurrentSessions: 5,
            sessionIdleTimeout: 30,
            rememberMeDuration: 30,
            requireStepUpFor: ['delete_account', 'change_password'],
            ipRestrictions: {
              enabled: false,
              whitelist: [],
              blacklist: [],
            },
            geoFencing: {
              enabled: false,
              allowedCountries: [],
              blockedCountries: [],
            },
            securityFeatures: {
              autoBlockSuspicious: true,
              requireReauthAfterSuspicious: true,
              enableVpnDetection: true,
              enableImpossibleTravelDetection: true,
              maxFailedLogins: 5,
              failedLoginWindow: 15,
            },
            notifications: {
              emailOnNewDevice: true,
              emailOnSuspicious: true,
              emailOnPolicyViolation: true,
              notifyAdminsOnCritical: true,
            },
          },
        });
      }

      const duration = Date.now() - startTime;

      log.info("Session policies fetched", { userId, duration });

      return NextResponse.json(policies as unknown as SessionPolicies, {
        headers: {
          "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          "X-Response-Time": `${duration}ms`,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Failed to fetch session policies", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      Sentry.captureException(error);

      // Security: Generic error message
      return NextResponse.json(
        { error: "Failed to fetch policies" },
        { status: 500 }
      );
    }
  }
);

/**
 * PUT /api/admin/sessions/policies
 * 
 * Update session policies configuration
 * 
 * Security: sessions:configure_policies permission check, rate limited
 * Performance: Efficient single update operation
 */
export const PUT = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "sessions:policies:update",
      limit: 30, // Max 30 policy updates per hour
      window: 3600,
      strategy: "sliding-window",
    },
    maxBodySize: 10000, // Policies can be complex
  },
  async (req, { userId }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true },
      });

      if (!user) {
        log.warn("Session policies update - user not found", { userId });
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // RBAC: Check sessions:configure_policies permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        "sessions:configure_policies"
      );

      if (!hasPermission) {
        log.warn("Session policies update - insufficient permissions", {
          userId,
          role: user.role,
        });
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }

      const body = await req.json();

      // Validate the structure
      if (!body || typeof body !== 'object') {
        log.warn("Session policies update - invalid data", { userId });
        return NextResponse.json(
          { error: "Invalid policy data" },
          { status: 400 }
        );
      }

      // Find existing policies
      const existing = await prisma.sessionPolicies.findFirst();

      let policies;
      if (existing) {
        // Update existing policies
        policies = await prisma.sessionPolicies.update({
          where: { id: existing.id },
          data: {
            maxConcurrentSessions: body.maxConcurrentSessions,
            sessionIdleTimeout: body.sessionIdleTimeout,
            rememberMeDuration: body.rememberMeDuration,
            requireStepUpFor: body.requireStepUpFor,
            ipRestrictions: body.ipRestrictions,
            geoFencing: body.geoFencing,
            securityFeatures: body.securityFeatures,
            notifications: body.notifications,
          },
        });
      } else {
        // Create new policies
        policies = await prisma.sessionPolicies.create({
          data: {
            maxConcurrentSessions: body.maxConcurrentSessions,
            sessionIdleTimeout: body.sessionIdleTimeout,
            rememberMeDuration: body.rememberMeDuration,
            requireStepUpFor: body.requireStepUpFor,
            ipRestrictions: body.ipRestrictions,
            geoFencing: body.geoFencing,
            securityFeatures: body.securityFeatures,
            notifications: body.notifications,
          },
        });
      }

      const duration = Date.now() - startTime;

      // Security: Audit log policy changes
      log.info("Session policies updated", {
        userId,
        updatedBy: user.email,
        duration,
      });

      Sentry.addBreadcrumb({
        category: "session.policies",
        message: "Session policies updated",
        level: "info",
        data: { userId, updatedBy: user.email },
      });

      return NextResponse.json(policies as unknown as SessionPolicies, {
        headers: {
          "X-Response-Time": `${duration}ms`,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Failed to update session policies", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      Sentry.captureException(error);

      // Security: Generic error message
      return NextResponse.json(
        { error: "Failed to update policies" },
        { status: 500 }
      );
    }
  }
);

