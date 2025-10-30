import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Better-Auth Catch-All Handler
 * 
 * This route handles all Better-Auth endpoints:
 * - /api/auth/sign-in/email - Email/password authentication
 * - /api/auth/sign-in/social - OAuth social authentication
 * - /api/auth/sign-out - Sign out endpoint
 * - /api/auth/session - Session management
 * - /api/auth/callback/* - OAuth callbacks
 * - /api/auth/verify-2fa - Two-factor authentication
 * - And other Better-Auth internal routes
 * 
 * IMPORTANT: Do not modify this file.
 * Better-Auth manages its own:
 * - Security and CSRF protection
 * - Rate limiting
 * - Session management
 * - Cookie handling
 * - Input validation
 * 
 * For custom auth logic or middleware, use Next.js middleware.ts
 */
export const { GET, POST } = toNextJsHandler(auth);
