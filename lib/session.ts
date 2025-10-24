import { auth } from "@/lib/auth";
import { headers as nextHeaders, cookies as nextCookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAdminRole, type Permission } from "@/lib/rbac";
import { userHasPermissionAsync } from "@/lib/rbac-server";

// Session validity window (e.g., 24 hours in milliseconds)
// Adjust based on your security requirements
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Convert Next.js readonly headers to mutable Headers instance.
 * Reusable helper to avoid duplication and improve maintainability.
 * Also ensures cookies are properly included for Better Auth.
 */
async function getHeaders(): Promise<Headers> {
    const h = await nextHeaders();
    const c = await nextCookies();
    
    // Type-safe conversion: iterate and copy headers
    const headers = new Headers();
    h.forEach((value, key) => {
        headers.set(key, value);
    });
    
    // Ensure cookie header is properly set for Better Auth
    // Better Auth needs cookies in the standard Cookie header format
    const cookieHeader = c.getAll()
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
    
    if (cookieHeader) {
        headers.set('cookie', cookieHeader);
    }
    
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
 * Get user data including role from database
 * This provides more detailed user information than just the session
 */
async function getUserWithRole(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true, // Now string instead of enum
                permissions: true,
                image: true,
            } as any,
        });
        
        return user as {
            id: string;
            name: string | null;
            email: string | null;
            role: string;
            permissions: any;
            image: string | null;
        } | null;
    } catch (error) {
        console.error("[Session] Failed to get user:", error);
        return null;
    }
}

/**
 * Ensure the current user is an admin (OWNER or ADMIN role).
 * Returns the session with user data when authorized, or null when unauthorized.
 * Fails closed on any error.
 */
// noinspection JSUnusedGlobalSymbols
export async function requireAdmin() {
    try {
        const headers = await getHeaders();
        const session = await auth.api.getSession({ headers });

        // Validate session integrity and freshness
        if (!isSessionValid(session)) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[requireAdmin] Session invalid");
            }
            return null;
        }

        const userId = session?.user?.id;
        if (!userId) {
            return null;
        }

        // Get user with role from database
        const user = await getUserWithRole(userId);
        
        if (!user) {
            console.warn("[requireAdmin] User not found:", userId);
            return null;
        }

        // Check if user has admin role (OWNER or ADMIN)
        if (!isAdminRole(user.role)) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[requireAdmin] Not admin:", {
                    userId: user.id,
                    role: user.role,
                });
            }
            if (process.env.NODE_ENV === "production") {
                console.warn("[Security] Unauthorized admin access attempt:", {
                    userId: user.id,
                    role: user.role,
                    timestamp: new Date().toISOString(),
                });
            }
            return null;
        }

        // Attach user data to session for convenience
        return {
            ...session,
            user: {
                ...session.user,
                role: user.role,
                permissions: user.permissions,
            },
        };
    } catch (error) {
        // Fail closed: on any error, treat as unauthorized
        console.error("[requireAdmin] Error:", error);
        return null;
    }
}

/**
 * Check if the current user has a specific permission.
 * This checks both role-based permissions and custom user permissions.
 */
// noinspection JSUnusedGlobalSymbols
export async function requirePermission(permission: Permission) {
    try {
        const headers = await getHeaders();
        const session = await auth.api.getSession({ headers });

        if (!isSessionValid(session)) {
            return null;
        }

        const userId = session?.user?.id;
        if (!userId) {
            return null;
        }

        const user = await getUserWithRole(userId);
        
        if (!user) {
            return null;
        }

        // Check if user has the required permission (async for custom roles)
        const customPerms = user.permissions as unknown as Record<string, boolean> | null;
        const hasPermission = await userHasPermissionAsync(user.role, permission, customPerms);

        if (!hasPermission) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[requirePermission] Permission denied:", {
                    userId: user.id,
                    role: user.role,
                    permission,
                });
            }
            return null;
        }

        return {
            ...session,
            user: {
                ...session.user,
                role: user.role,
                permissions: user.permissions,
            },
        };
    } catch (error) {
        console.error("[requirePermission] Error:", error);
        return null;
    }
}

/**
 * Get the current user with their role and permissions.
 * Does not require any specific role or permission.
 */
// noinspection JSUnusedGlobalSymbols
export async function getCurrentUser() {
    try {
        const headers = await getHeaders();
        const session = await auth.api.getSession({ headers });

        if (!isSessionValid(session)) {
            return null;
        }

        const userId = session?.user?.id;
        if (!userId) {
            return null;
        }

        const user = await getUserWithRole(userId);
        
        if (!user) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions as Record<string, boolean> | null,
            image: user.image,
        };
    } catch (error) {
        console.error("[getCurrentUser] Error:", error);
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
