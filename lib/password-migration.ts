/**
 * Password Migration Utility
 * 
 * Provides gradual migration from bcrypt to Argon2id without forcing password resets.
 * Users are automatically migrated on their next successful login.
 */

import { hash as argon2Hash, verify as argon2Verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * Argon2id configuration (OWASP 2023 recommendations)
 */
export const ARGON2_CONFIG = {
  memoryCost: 19456,      // 19 MiB (OWASP minimum)
  timeCost: 2,            // 2 iterations (OWASP minimum)
  parallelism: 1,         // Single thread for web apps
  outputLen: 32,          // 32 bytes output
} as const;

/**
 * Check if a hash is in bcrypt format
 * @param hash - Password hash to check
 * @returns True if bcrypt hash
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
}

/**
 * Check if a hash is in Argon2 format
 * @param hash - Password hash to check
 * @returns True if Argon2 hash
 */
export function isArgon2Hash(hash: string): boolean {
  return hash.startsWith("$argon2");
}

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Argon2id hash
 */
export async function hashPasswordArgon2(password: string): Promise<string> {
  return await argon2Hash(password, ARGON2_CONFIG);
}

/**
 * Hash a password using bcrypt (legacy, for backward compatibility only)
 * @param password - Plain text password
 * @returns bcrypt hash
 * @deprecated Use hashPasswordArgon2 instead
 */
export async function hashPasswordBcrypt(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash (supports both bcrypt and Argon2id)
 * @param storedHash - Hash from database
 * @param plainPassword - Plain text password to verify
 * @returns True if password matches
 */
export async function verifyPassword(
  storedHash: string,
  plainPassword: string
): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    // Legacy bcrypt verification
    try {
      return await bcrypt.compare(plainPassword, storedHash);
    } catch (error) {
      console.error("[Password Verification] bcrypt error:", error);
      return false;
    }
  } else if (isArgon2Hash(storedHash)) {
    // Modern Argon2id verification
    try {
      return await argon2Verify(storedHash, plainPassword);
    } catch (error) {
      console.error("[Password Verification] Argon2 error:", error);
      return false;
    }
  } else {
    console.error("[Password Verification] Unknown hash format:", storedHash.substring(0, 10));
    return false;
  }
}

/**
 * Verify password with automatic migration from bcrypt to Argon2id
 * 
 * Flow:
 * 1. Verify password against stored hash (bcrypt or Argon2id)
 * 2. If valid AND bcrypt: trigger background migration to Argon2id
 * 3. Return verification result immediately (don't block login)
 * 
 * This allows gradual migration without forcing password resets.
 * 
 * @param storedHash - Hash from database
 * @param plainPassword - Plain text password to verify
 * @param userId - User ID for migration
 * @returns True if password matches
 */
export async function verifyAndMigratePassword(
  storedHash: string,
  plainPassword: string,
  userId: string
): Promise<boolean> {
  // Verify password
  const isValid = await verifyPassword(storedHash, plainPassword);

  if (!isValid) {
    return false;
  }

  // If valid and still using bcrypt, migrate in background
  if (isBcryptHash(storedHash)) {
    // Don't await - run in background to not block login
    migrateUserToArgon2(plainPassword, userId).catch((error) => {
      console.error("[Password Migration] Failed for user:", userId, error);
    });
  }

  return true;
}

/**
 * Background migration from bcrypt to Argon2id
 * 
 * @param plainPassword - Plain text password (only available during login)
 * @param userId - User ID to migrate
 */
async function migrateUserToArgon2(plainPassword: string, userId: string): Promise<void> {
  try {
    // Hash with Argon2id
    const newHash = await hashPasswordArgon2(plainPassword);

    // Update all accounts for this user (credential provider)
    const result = await prisma.account.updateMany({
      where: {
        userId,
        providerId: "credential",
      },
      data: {
        password: newHash,
      },
    });

    if (result.count > 0) {
      console.log(`[Password Migration] ✅ Migrated user ${userId} to Argon2id`);
    } else {
      console.warn(`[Password Migration] ⚠️ No accounts found for user ${userId}`);
    }
  } catch (error) {
    console.error("[Password Migration] ❌ Migration failed:", error);
    throw error;
  }
}

/**
 * Get migration statistics (how many users still on bcrypt)
 * 
 * @returns Migration statistics
 */
export async function getMigrationStats(): Promise<{
  total: number;
  argon2: number;
  bcrypt: number;
  unknown: number;
  percentMigrated: number;
}> {
  const accounts = await prisma.account.findMany({
    where: {
      providerId: "credential",
      password: { not: null },
    },
    select: {
      password: true,
    },
  });

  let argon2Count = 0;
  let bcryptCount = 0;
  let unknownCount = 0;

  for (const account of accounts) {
    if (!account.password) continue;

    if (isArgon2Hash(account.password)) {
      argon2Count++;
    } else if (isBcryptHash(account.password)) {
      bcryptCount++;
    } else {
      unknownCount++;
    }
  }

  const total = accounts.length;
  const percentMigrated = total > 0 ? Math.round((argon2Count / total) * 100) : 0;

  return {
    total,
    argon2: argon2Count,
    bcrypt: bcryptCount,
    unknown: unknownCount,
    percentMigrated,
  };
}

/**
 * Force migrate a specific user to Argon2id
 * Requires knowing the plain text password (e.g., during password reset)
 * 
 * @param userId - User ID
 * @param plainPassword - Plain text password
 */
export async function forceMigrateUser(userId: string, plainPassword: string): Promise<void> {
  await migrateUserToArgon2(plainPassword, userId);
}

