// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../lib/env";

const prisma = new PrismaClient();

async function main() {
    // Initialize system roles first
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

    console.log("🔧 Initializing system roles...");
    for (const role of systemRoles) {
        await (prisma as any).customRole.upsert({
            where: { slug: role.slug },
            update: {},
            create: role,
        });
    }
    console.log("✅ System roles initialized");

    const email = env.ADMIN_EMAIL || "clarkcj01@gmail.com";
    const password = env.ADMIN_PASSWORD || "Zackcat12";
    const hash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: "OWNER" as any, name: "Site Owner" },
        create: {
            email,
            role: "OWNER" as any,
            name: "Site Owner",
        },
    });

    // Create or update the account with password
    await prisma.account.upsert({
        where: {
            providerId_accountId: {
                providerId: "credential",
                accountId: admin.id,
            },
        },
        update: {
            password: hash,
        },
        create: {
            userId: admin.id,
            providerId: "credential",
            accountId: admin.id,
            password: hash,
        },
    });

    console.log("✅ Owner user created or updated:");
    console.log(`Email: ${admin.email}`);
    console.log(`Role: OWNER`);
    console.log(`Temp password: ${password}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
