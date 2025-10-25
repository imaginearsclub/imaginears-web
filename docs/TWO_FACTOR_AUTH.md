# Two-Factor Authentication (2FA) Implementation

## Overview

Two-Factor Authentication has been successfully implemented for the Imaginears Club application. This adds an extra layer of security by requiring users to verify their identity with a time-based one-time password (TOTP) in addition to their username and password.

## Features

### ✅ Completed Features

1. **TOTP Setup with QR Code**
   - Users can enable 2FA from their profile page
   - QR code generated for easy scanning with authenticator apps
   - Manual entry option with secret key display
   - Supports any TOTP-compatible app (Google Authenticator, Authy, 1Password, etc.)

2. **Backup Codes**
   - 8 single-use backup codes generated during setup
   - Codes can be downloaded as a text file
   - Used for recovery if authenticator app is unavailable

3. **Secure Storage**
   - TOTP secrets encrypted using AES-256-CBC
   - Backup codes hashed using SHA-256
   - Encryption key stored in environment variables

4. **Profile Management**
   - Enable/disable 2FA from profile page
   - View 2FA status with visual indicators
   - Require password + 2FA code to disable

5. **Security Features**
   - Time window tolerance for clock drift (±30 seconds)
   - One-time use backup codes
   - Encrypted storage of TOTP secrets
   - Password verification for disabling 2FA

## Setup Instructions

### 1. Generate Encryption Key

Run the provided script to generate a secure encryption key:

\`\`\`bash
node scripts/generate-encryption-key.js
\`\`\`

Copy the generated key and add it to your `.env` file:

\`\`\`env
ENCRYPTION_KEY=your_64_character_hex_key_here
\`\`\`

**⚠️ Important:** 
- Keep this key secret and secure
- Never commit it to version control
- If you lose this key, all 2FA secrets will be unrecoverable
- Changing this key will disable 2FA for all users

### 2. Database Migration

The migration has already been applied. It adds these fields to the `user` table:
- `twoFactorEnabled` - Boolean flag indicating if 2FA is active
- `twoFactorSecret` - Encrypted TOTP secret
- `backupCodes` - JSON array of hashed backup codes

### 3. Reload TypeScript Server

After running the Prisma migration, you may need to reload the TypeScript server in your IDE to pick up the new types:

**VS Code / Cursor:**
1. Open the Command Palette (Ctrl/Cmd + Shift + P)
2. Type "TypeScript: Restart TS Server"
3. Select and run it

## User Flow

### Enabling 2FA

1. Navigate to Profile → Two-Factor Authentication card
2. Click "Enable Two-Factor Authentication"
3. Scan QR code with authenticator app (or enter secret manually)
4. Enter the 6-digit code from the app to verify
5. Save the 8 backup codes in a secure location
6. 2FA is now active!

### Disabling 2FA

1. Navigate to Profile → Two-Factor Authentication card
2. Enter current password
3. Enter current 2FA code (or backup code)
4. Click "Disable 2FA"
5. 2FA is now disabled and all codes are removed

### Using Backup Codes

Backup codes can be used instead of TOTP codes:
- Each code can only be used once
- Format: XXXX-XXXX (e.g., A3B4-C5D6)
- After use, the code is permanently invalidated
- Remaining codes continue to work

## File Structure

\`\`\`
lib/
  └── two-factor.ts              # 2FA utility functions

app/profile/
  ├── page.tsx                   # Profile page with 2FA server actions
  └── components/
      └── TwoFactorSetup.tsx     # 2FA UI component

scripts/
  └── generate-encryption-key.js # Key generation script

prisma/
  ├── schema.prisma              # Updated User model
  └── migrations/
      └── [timestamp]_add_two_factor_auth/
          └── migration.sql      # 2FA fields migration
\`\`\`

## API Reference

### Server Actions

#### `enable2FAAction(formData: FormData)`
Generates a new TOTP secret and QR code for setup.

**Returns:**
\`\`\`typescript
{
  success: boolean;
  message: string;
  qrCode?: string;      // Data URL for QR image
  secret?: string;      // Base32 TOTP secret
}
\`\`\`

#### `verify2FASetupAction(formData: FormData)`
Verifies the setup code and enables 2FA.

**Parameters:**
- `verificationCode` - 6-digit TOTP code
- `secret` - TOTP secret (hidden field)

**Returns:**
\`\`\`typescript
{
  success: boolean;
  message: string;
  backupCodes?: string[]; // Array of 8 backup codes
}
\`\`\`

#### `disable2FAAction(formData: FormData)`
Disables 2FA after verifying password and code.

**Parameters:**
- `password` - User's current password
- `code` - Current 2FA code or backup code

**Returns:**
\`\`\`typescript
{
  success: boolean;
  message: string;
}
\`\`\`

### Utility Functions

See `lib/two-factor.ts` for detailed documentation of:
- `generateTOTPSecret()` - Generate new TOTP secret
- `generateQRCode()` - Create QR code data URL
- `verifyTOTPToken()` - Verify 6-digit code
- `generateBackupCodes()` - Create backup codes
- `hashBackupCode()` - Hash backup code for storage
- `verifyBackupCode()` - Verify and consume backup code
- `encryptSecret()` - Encrypt TOTP secret
- `decryptSecret()` - Decrypt TOTP secret

## Security Considerations

### Encryption
- TOTP secrets are encrypted using AES-256-CBC
- Initialization vector (IV) is randomly generated for each encryption
- Encryption key must be 64 hex characters (32 bytes)

### Backup Codes
- Hashed using SHA-256 before storage
- Codes are normalized (lowercase, no hyphens) before hashing
- Each code can only be used once

### TOTP Configuration
- 30-second time step
- 6-digit codes
- ±30 second window for clock drift tolerance
- Follows RFC 6238 standard

## Supported Authenticator Apps

Any TOTP-compatible authenticator app will work:
- ✅ Google Authenticator
- ✅ Microsoft Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ Bitwarden
- ✅ LastPass Authenticator
- ✅ FreeOTP
- ✅ And many others...

## Login Flow

### ✅ Implemented Features

1. **Two-Step Login Process**
   - User enters email and password
   - System checks if 2FA is enabled for the account
   - If enabled, shows 2FA verification screen
   - User enters 6-digit TOTP code or backup code
   - Session created only after successful 2FA verification

2. **2FA Verification Screen**
   - Clean, focused UI for code entry
   - Auto-advancing 6-digit input fields
   - Paste support for quick entry
   - Toggle between TOTP and backup code entry
   - "Back to Login" option to restart authentication
   - Security tip reminder

3. **Backup Code Support**
   - Can use backup codes instead of TOTP
   - Backup codes are consumed after use
   - Remaining codes continue to work

### 🔄 Future Enhancements

1. **Device Trust** (Not yet implemented)
   - "Trust this device" option for 30 days
   - Remember device with secure cookie
   - Manage trusted devices from profile

2. **Session Security**
   - Force 2FA verification for sensitive actions
   - Re-verify 2FA before changing account settings
   - Automatic logout after password change

3. **Recovery Options**
   - Email-based 2FA bypass for emergencies
   - Admin ability to reset 2FA for users
   - Regenerate backup codes

4. **Enforcement Policies**
   - Require 2FA for admin/staff roles
   - Grace period for 2FA enablement
   - Reminder notifications

5. **Audit Logging**
   - Log 2FA enable/disable events
   - Track backup code usage
   - Failed verification attempts

## Testing

### Manual Testing Checklist

- [ ] Enable 2FA with QR code scan
- [ ] Enable 2FA with manual entry
- [ ] Verify code validation works
- [ ] Download and save backup codes
- [ ] Disable 2FA with TOTP code
- [ ] Disable 2FA with backup code
- [ ] Verify expired codes are rejected
- [ ] Test clock drift tolerance
- [ ] Ensure backup codes are one-time use
- [ ] Verify encrypted secrets in database

### Test User Flow

1. Create a test account
2. Enable 2FA
3. Use authenticator app to verify
4. Save backup codes
5. Log out (when login flow is implemented)
6. Log in with password + 2FA
7. Use backup code once
8. Verify that code can't be reused
9. Disable 2FA
10. Verify all 2FA data is cleared

## Troubleshooting

### "Invalid verification code" Error

**Possible causes:**
1. Clock drift between server and device
2. Code expired (30-second window)
3. Code already used
4. Wrong secret key

**Solutions:**
- Ensure server and device clocks are synchronized
- Try the next code from authenticator app
- Rescan QR code if using manual entry

### "ENCRYPTION_KEY must be a 64-character hex string" Error

**Solution:**
- Generate a new key: `node scripts/generate-encryption-key.js`
- Add it to your `.env` file
- Restart the application

### TypeScript Errors After Migration

**Solution:**
- Run: `npx prisma generate`
- Restart TypeScript server in your IDE
- Restart development server

## Support

For issues or questions:
1. Check this documentation
2. Review the implementation in `lib/two-factor.ts`
3. Check server logs for detailed error messages
4. Contact the development team

## Credits

**Dependencies:**
- `otplib` - TOTP generation and verification
- `qrcode` - QR code generation
- Node.js `crypto` - Encryption and hashing

**Standards:**
- RFC 6238 - TOTP: Time-Based One-Time Password Algorithm
- RFC 4226 - HOTP: An HMAC-Based One-Time Password Algorithm

---

**Implementation Date:** October 2024  
**Version:** 1.0  
**Status:** ✅ Complete (Login flow pending)

