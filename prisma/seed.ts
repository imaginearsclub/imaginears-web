// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = process.env.ADMIN_EMAIL || "clarkcj01@gmail.com";
    const password = process.env.ADMIN_PASSWORD || "Zackcat12";
    const hash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hash, role: "ADMIN", name: "Site Admin" },
        create: {
            email,
            passwordHash: hash,
            role: "ADMIN",
            name: "Site Admin",
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
