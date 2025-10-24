/**
 * Fix CustomRole permissions - convert arrays to JSON strings
 * Run this script once to fix existing data after the JSON format issue
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing CustomRole permissions format...");

  const roles = await (prisma as any).customRole.findMany();
  
  let fixed = 0;
  let skipped = 0;

  for (const role of roles) {
    const perms = role.permissions;
    
    // Check if permissions is already a string
    if (typeof perms === "string") {
      console.log(`✓ ${role.slug}: Already in correct format`);
      skipped++;
      continue;
    }

    // If it's an array or object, convert to JSON string
    try {
      const jsonString = typeof perms === "object" 
        ? JSON.stringify(perms) 
        : perms;

      await (prisma as any).customRole.update({
        where: { id: role.id },
        data: { permissions: jsonString },
      });

      console.log(`✓ ${role.slug}: Fixed (${Array.isArray(perms) ? perms.length : 0} permissions)`);
      fixed++;
    } catch (error) {
      console.error(`✗ ${role.slug}: Failed to fix -`, error);
    }
  }

  console.log(`\n✅ Complete! Fixed: ${fixed}, Skipped: ${skipped}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

