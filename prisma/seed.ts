// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { env } from "../lib/env";

const prisma = new PrismaClient();

async function main() {
    const email = env.ADMIN_EMAIL || "clarkcj01@gmail.com";
    const password = env.ADMIN_PASSWORD || "Zackcat12";
    const hash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { role: "ADMIN", name: "Site Admin" },
        create: {
            email,
            role: "ADMIN",
            name: "Site Admin",
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

    console.log("✅ Admin user created or updated:");
    console.log(`Email: ${admin.email}`);
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
