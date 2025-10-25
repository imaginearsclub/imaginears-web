/**
 * Two-Factor Authentication utilities
 * 
 * Provides TOTP (Time-based One-Time Password) functionality for 2FA
 * Uses otplib for TOTP generation and verification
 */

import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

// Configure authenticator settings
authenticator.options = {
  window: 1, // Allow 1 step backward/forward for time drift (30s each)
  step: 30, // 30-second time step
};

/**
 * Generate a new TOTP secret for a user
 * @returns Base32-encoded secret string
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code data URL for TOTP setup
 * @param email User's email
 * @param secret TOTP secret
 * @param issuer Service name
 * @returns QR code data URL for display
 */
export async function generateQRCode(
  email: string,
  secret: string,
  issuer: string = "Imaginears Club"
): Promise<string> {
  const otpauth = authenticator.keyuri(email, issuer, secret);
  return await QRCode.toDataURL(otpauth);
}

/**
 * Verify a TOTP code against a secret
 * @param token 6-digit code from authenticator app
 * @param secret User's TOTP secret
 * @returns True if valid, false otherwise
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("[2FA] TOTP verification error:", error);
    return false;
  }
}

/**
 * Generate backup codes for 2FA recovery
 * @param count Number of backup codes to generate (default: 8)
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    // Format as XXXX-XXXX for readability
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formatted);
  }
  
  return codes;
}

/**
 * Hash a backup code for secure storage
 * @param code Plain backup code
 * @returns Hashed backup code
 */
export function hashBackupCode(code: string): string {
  // Remove formatting (hyphens) and convert to lowercase for consistent hashing
  const normalized = code.replace(/-/g, "").toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Verify a backup code against stored hashes
 * @param inputCode User-provided backup code
 * @param hashedCodes Array of hashed backup codes from database
 * @returns Object with verification result and remaining codes
 */
export function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): { valid: boolean; remainingCodes?: string[] } {
  const inputHash = hashBackupCode(inputCode);
  const codeIndex = hashedCodes.indexOf(inputHash);
  
  if (codeIndex === -1) {
    return { valid: false };
  }
  
  // Remove used code and return remaining codes
  const remainingCodes = hashedCodes.filter((_, index) => index !== codeIndex);
  
  return {
    valid: true,
    remainingCodes,
  };
}

/**
 * Encrypt sensitive data (like TOTP secret) for database storage
 * @param data Plain text to encrypt
 * @returns Encrypted string
 */
export function encryptSecret(data: string): string {
  const key = process.env['ENCRYPTION_KEY'];
  
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  
  const algorithm = "aes-256-cbc";
  const keyBuffer = Buffer.from(key, "hex");
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive data from database
 * @param encryptedData Encrypted string from database
 * @returns Decrypted plain text
 */
export function decryptSecret(encryptedData: string): string {
  const key = process.env['ENCRYPTION_KEY'];
  
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  
  const algorithm = "aes-256-cbc";
  const keyBuffer = Buffer.from(key, "hex");
  
  const parts = encryptedData.split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Invalid encrypted data format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Format time remaining for TOTP code
 * @returns Seconds remaining until next code
 */
export function getTOTPTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000);
  const step = authenticator.options.step || 30;
  return step - (now % step);
}

