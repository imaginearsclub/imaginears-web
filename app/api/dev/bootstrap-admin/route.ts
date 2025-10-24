import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// This route assumes Better-Auth is configured with the Organization plugin.
// It will:
//  - ensure there's at least one organization (create "Imaginears" if none)
//  - ensure the current user is an OWNER in that org
//  - set the user's role to OWNER in the User table
//  - set active organization to that org (if the API is available)

export async function POST() {
    const h = await nextHeaders();
    const hdrs = new Headers(h as unknown as Headers);

    // Must be authenticated (we just signed up)
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    const userId = session.user.id;

    // 0) Set user's role to OWNER in the User table
    await prisma.user.update({
        where: { id: userId },
        data: { role: "OWNER" } as any,
    });

    // 0.5) Initialize system roles in CustomRole table if they don't exist
    const systemRoles = [
        {
            slug: "OWNER",
            name: "Owner",
            description: "Full system access. Can manage everything including critical settings.",
            permissions: JSON.stringify(["events:read", "events:write", "events:delete", "events:publish", "applications:read", "applications:write", "applications:delete", "applications:approve", "players:read", "players:write", "players:ban", "users:read", "users:write", "users:delete", "users:manage_roles", "settings:read", "settings:write", "settings:security", "dashboard:view", "dashboard:stats", "system:maintenance", "system:logs"]),
            isSystem: true,
            color: "#DC2626",
        },
        {
            slug: "ADMIN",
            name: "Administrator",
            description: "Can manage most features, users, and settings. Cannot access critical security settings.",
            permissions: JSON.stringify(["events:read", "events:write", "events:delete", "events:publish", "applications:read", "applications:write", "applications:delete", "applications:approve", "players:read", "players:write", "players:ban", "users:read", "users:write", "settings:read", "settings:write", "dashboard:view", "dashboard:stats", "system:logs"]),
            isSystem: true,
            color: "#16A34A",
        },
        {
            slug: "MODERATOR",
            name: "Moderator",
            description: "Can manage events, applications, and players. Limited settings access.",
            permissions: JSON.stringify(["events:read", "events:write", "events:publish", "applications:read", "applications:write", "applications:approve", "players:read", "players:write", "users:read", "settings:read", "dashboard:view", "dashboard:stats"]),
            isSystem: true,
            color: "#3B82F6",
        },
        {
            slug: "STAFF",
            name: "Staff Member",
            description: "Can view and assist with events and applications. Read-only for most features.",
            permissions: JSON.stringify(["events:read", "events:write", "applications:read", "applications:write", "players:read", "users:read", "settings:read", "dashboard:view"]),
            isSystem: true,
            color: "#8B5CF6",
        },
        {
            slug: "USER",
            name: "User",
            description: "Basic authenticated access. Can view own information and public content.",
            permissions: JSON.stringify(["dashboard:view"]),
            isSystem: true,
            color: "#64748B",
        },
    ];

    for (const role of systemRoles) {
        await (prisma as any).customRole.upsert({
            where: { slug: role.slug },
            update: {},
            create: role,
        });
    }

    // 1) list orgs I have access to
    const orgList = await auth.api.listOrganizations({ headers: hdrs });
    let orgId = (orgList as any)?.[0]?.id as string | undefined;

    // 2) create if none exists
    if (!orgId) {
        const created = await auth.api.createOrganization({ 
            headers: hdrs, 
            body: { name: "Imaginears", slug: "imaginears" } 
        });
        if (!(created as any)?.id) {
            return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
        }
        orgId = (created as any).id;
    }

    // 3) add me as owner if I'm not a member yet
    // Try to add as owner; if already member, try to promote
    try {
        await auth.api.addMember({ 
            headers: hdrs, 
            body: { 
                userId,
                organizationId: orgId!, 
                role: ["owner"] as any 
            } 
        });
    } catch {
        // maybe already a member; try updating role if such endpoint exists
        try {
            await auth.api.updateMemberRole?.({
                headers: hdrs,
                body: { organizationId: orgId!, userId: userId, role: ["owner"] as any },
            } as any);
        } catch {
            /* ignore if not supported; creator is usually owner by default */
        }
    }

    // 4) set active organization for this session (if supported by your version)
    try {
        await auth.api.setActiveOrganization?.({ headers: hdrs, body: { organizationId: orgId! } } as any);
    } catch {
        /* optional */
    }

    return NextResponse.json({ ok: true, organizationId: orgId, userId, role: "OWNER" });

}

