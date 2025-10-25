/**
 * Prisma Client for Minecraft Database (LuckPerms)
 * 
 * This is a separate Prisma client instance for your Minecraft server's database.
 * It allows you to query LuckPerms data directly.
 */

import { PrismaClient as MinecraftPrismaClient } from "../node_modules/.prisma/minecraft-client";

// Prevent multiple instances in development
const globalForMinecraftPrisma = globalThis as unknown as {
  minecraftPrisma: MinecraftPrismaClient | undefined;
};

export const minecraftPrisma =
  globalForMinecraftPrisma.minecraftPrisma ??
  new MinecraftPrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForMinecraftPrisma.minecraftPrisma = minecraftPrisma;
}

// Helper: Check if Minecraft database is configured
export function isMinecraftDbConfigured(): boolean {
  return Boolean(process.env['MINECRAFT_DATABASE_URL']);
}

// Helper: Test database connection
export async function testMinecraftDbConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isMinecraftDbConfigured()) {
    return {
      success: false,
      error: "MINECRAFT_DATABASE_URL not configured",
    };
  }

  try {
    // Try a simple query
    await minecraftPrisma.$queryRaw`SELECT 1`;
    return { success: true };
  } catch (error) {
    console.error("[Minecraft DB] Connection test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper: Get table prefix (in case it's not the default "luckperms_")
export function getLuckPermsTablePrefix(): string {
  return process.env['LUCKPERMS_TABLE_PREFIX'] || "luckperms_";
}

// Export types for convenience
export type {
  LuckPermsPlayer,
  LuckPermsUserPermission,
  LuckPermsGroup,
  LuckPermsGroupPermission,
  LuckPermsAction,
} from "../node_modules/.prisma/minecraft-client";

