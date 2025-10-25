#!/usr/bin/env node

/**
 * Generate a secure encryption key for Two-Factor Authentication
 * 
 * This script generates a random 32-byte (256-bit) encryption key
 * encoded as a 64-character hexadecimal string.
 * 
 * Usage: node scripts/generate-encryption-key.js
 */

import crypto from 'crypto';

// Generate 32 random bytes (256 bits)
const key = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Two-Factor Authentication Encryption Key Generated\n');
console.log('Add this to your .env file:\n');
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log('⚠️  Important:');
console.log('  - Keep this key secret and secure');
console.log('  - Never commit it to version control');
console.log('  - If you lose this key, all 2FA secrets will be unrecoverable');
console.log('  - Changing this key will disable 2FA for all users\n');

