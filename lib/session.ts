import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

// Roles that are allowed to access admin functionality
// Frozen to prevent runtime tampering
const ADMIN_ROLES = Object.freeze(new Set(["owner", "admin"] as const));

// Session validity window (e.g., 24 hours in milliseconds)
// Adjust based on your security requirements
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Convert Next.js readonly headers to mutable Headers instance.
 * Reusable helper to avoid duplication and improve maintainability.
 */
async function getHeaders(): Promise<Headers> {
    const h = await nextHeaders();
    // Type-safe conversion: iterate and copy headers
    const headers = new Headers();
    h.forEach((value, key) => {
        headers.set(key, value);
    });
    return headers;
}

/**
 * Validate session freshness and integrity.
 * @returns true if session is valid and not expired
 */
function isSessionValid(session: any): boolean {
    if (!session) return false;
    
    // Validate required session properties exist
    if (!session.user?.id || !session.session?.id) return false;
    
    // Check session expiry if expiresAt is available
    if (session.session.expiresAt) {
        const expiryTime = new Date(session.session.expiresAt).getTime();
        if (Date.now() >= expiryTime) {
            // Session has expired
            return false;
        }
    }
    
    // Check session age if createdAt is available
    if (session.session.createdAt) {
        const createdTime = new Date(session.session.createdAt).getTime();
        const age = Date.now() - createdTime;
        if (age > MAX_SESSION_AGE_MS) {
            // Session is too old, even if not technically expired
            return false;
        }
    }
    
    return true;
}

/**
 * Fetch the current Better-Auth session on the server.
 * Works in Server Components and Route Handlers.
 * Returns null if session is invalid or expired.
 */
// noinspection JSUnusedGlobalSymbols
export async function getServerSession() {
    try {
        const headers = await getHeaders();
        const session = await auth.api.getSession({ headers });
        
        // Validate session before returning
        if (!isSessionValid(session)) {
            return null;
        }
        
        return session;
    } catch (error) {
        // Log error for monitoring (adjust based on your logging setup)
        if (process.env.NODE_ENV === "development") {
            console.error("[Session] Failed to get session:", error);
        }
        return null;
    }
}

/**
 * Ensure the current user is an admin (owner/admin org role).
 * Returns the session when authorized, or null when unauthorized.
 * Fails closed on any error.
 */
// noinspection JSUnusedGlobalSymbols
export async function requireAdmin() {
    try {
        const headers = await getHeaders();

        // Do both requests in parallel for better latency
        const [session, roleResult] = await Promise.all([
            auth.api.getSession({ headers }),
            auth.api.getActiveMemberRole({ headers })
        ]);

        // Validate session integrity and freshness
        if (!isSessionValid(session)) {
            return null;
        }

        // Normalize role to array for consistent handling
        const roleRaw = (roleResult?.role ?? undefined) as string | string[] | undefined;
        const roles = Array.isArray(roleRaw) ? roleRaw : roleRaw ? [roleRaw] : [];
        
        // Check if user has any admin role (type-safe check)
        const isAdmin = roles.some((r) => ADMIN_ROLES.has(r as "owner" | "admin"));
        
        if (!isAdmin) {
            // Log unauthorized admin access attempts in production for security monitoring
            if (process.env.NODE_ENV === "production" && session) {
                console.warn("[Security] Unauthorized admin access attempt:", {
                    userId: session.user?.id,
                    roles,
                    timestamp: new Date().toISOString(),
                });
            }
            return null;
        }

        return session;
    } catch (error) {
        // Fail closed: on any error, treat as unauthorized
        // Log security-relevant errors for monitoring
        if (process.env.NODE_ENV === "production") {
            console.error("[Security] Admin auth error:", error);
        }
        return null;
    }
}

/**
 * Get the current user ID from session.
 * Convenience helper that fails safely.
 */
// noinspection JSUnusedGlobalSymbols
export async function getCurrentUserId(): Promise<string | null> {
    const session = await getServerSession();
    return session?.user?.id ?? null;
}
