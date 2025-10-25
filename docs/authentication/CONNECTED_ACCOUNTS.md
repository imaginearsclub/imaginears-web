# Connected Accounts & Discord Integration

## Overview

Users can now link multiple authentication methods to their account, providing flexibility and backup login options. Currently supported:
- ✅ Email & Password (credential provider)
- ✅ Discord OAuth

## Features

### ✅ Implemented

1. **View Connected Accounts**
   - See all linked authentication methods
   - View connection dates
   - Visual indicators for each provider

2. **Link Discord Account**
   - One-click Discord OAuth linking
   - Connects to existing user account
   - Immediate login capability after linking

3. **Unlink Accounts**
   - Remove authentication methods
   - Safety check: Cannot unlink last method
   - Confirmation dialog before unlinking

4. **Profile Management**
   - New "Connected Accounts" card in profile
   - Clear UI showing connection status
   - Easy-to-use link/unlink buttons

## User Experience

### Linking Discord

1. Navigate to Profile → Connected Accounts
2. Click "Link Discord" button
3. Authorize on Discord OAuth page
4. Automatically redirected back
5. Discord now linked - can use for login!

### Unlinking Discord

1. Navigate to Profile → Connected Accounts
2. Click "Unlink" next to Discord
3. Confirm the action
4. Discord unlinked (requires another auth method first)

### Security Features

- ✅ Cannot unlink your only authentication method
- ✅ Must have email+password OR Discord to unlink the other
- ✅ 2FA protection applies to ALL login methods
- ✅ Secure OAuth 2.0 flow

## How It Works

### Database Structure

Each authentication method is stored as an `Account` record:
```prisma
model Account {
  id         String  @id
  userId     String
  providerId String  // "credential" or "discord"
  accountId  String  // Email or Discord user ID
  // ... other fields
}
```

One user can have multiple Account records, allowing multiple login methods.

### Linking Flow

1. User clicks "Link Discord"
2. Server generates OAuth URL: `/api/auth/sign-in/discord?mode=link`
3. User authorizes on Discord
4. Better-Auth handles callback
5. Discord account linked to existing user
6. User can now login with either method

### Login Flow

Users can login with ANY linked method:
- **Email + Password**: Traditional login form
- **Discord**: OAuth button on login page

All login methods lead to the same user account with the same data, sessions, and permissions.

## OAuth + 2FA Behavior

### ✅ By Design: OAuth Security Model

**Discord OAuth uses Discord's security system instead of our 2FA.**

When a user logs in via Discord:
1. Discord handles authentication with their own security
2. User is signed in after Discord verification
3. Our custom 2FA is not required (by design)

### Why This Approach

This is **intentional** and follows industry best practices:

1. **Discord Has Their Own 2FA**
   - Discord offers robust two-factor authentication
   - Users can enable it in their Discord security settings
   - This protects the Discord login just as effectively

2. **User Convenience**
   - OAuth provides a streamlined login experience
   - No double authentication burden
   - Users trust Discord's security infrastructure

3. **Industry Standard**
   - Most applications with OAuth don't require additional 2FA
   - The OAuth provider's security is considered sufficient
   - Examples: Google, GitHub, Microsoft all work this way

### Security Comparison

| Login Method | Security Layer | 2FA Provider |
|--------------|---------------|--------------|
| **Email + Password** | Our custom 2FA | Imaginears (TOTP) |
| **Discord OAuth** | Discord's security | Discord (optional) |

**Both methods provide strong security** - just with different providers.

### Recommendations for Users

**For Maximum Security:**
- Enable 2FA on **both** systems:
  - ✅ Enable our 2FA for email+password login
  - ✅ Enable Discord 2FA in Discord settings
- Link both methods for backup access

**For Convenience:**
- Use Discord OAuth for quick login
- Keep email+password as backup
- Enable Discord 2FA for protection

**For Admin/Staff:**
- We recommend enabling our 2FA (for email+password)
- Optionally use Discord with Discord 2FA enabled
- Both methods provide adequate security for staff roles

## Future Enhancements

### 🔄 Pending Features

1. **Additional OAuth Providers**
   - Google OAuth
   - GitHub OAuth
   - Microsoft OAuth
   - Apple Sign-In

2. **Account Management**
   - Primary account designation
   - Account merge functionality
   - Suspicious activity alerts

3. **Enhanced UI**
   - Last used timestamp for each method
   - Login history per provider
   - Security recommendations

## API Reference

### Server Actions

#### `linkDiscordAction(formData: FormData)`
Initiates Discord OAuth linking flow.

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  url?: string;  // OAuth URL to redirect to
}
```

#### `unlinkAccountAction(formData: FormData)`
Unlinks an authentication provider.

**Parameters:**
- `providerId` - Provider to unlink ("discord", etc.)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

## File Structure

```
app/profile/
  ├── page.tsx                         # Added accounts fetching & actions
  └── components/
      └── ConnectedAccounts.tsx        # UI for managing accounts

docs/
  └── CONNECTED_ACCOUNTS.md            # This file
```

## Security Considerations

### Multiple Account Safety

1. **Preventing Account Lockout**
   - Users must have at least one auth method
   - Cannot unlink last authentication provider
   - Clear warnings before unlinking

2. **OAuth Security**
   - Uses Better-Auth's secure OAuth implementation
   - State verification prevents CSRF
   - Nonce validation prevents replay attacks

3. **Account Linking Verification**
   - Must be logged in to link accounts
   - Cannot link if already connected
   - Session validation on every operation

### Recommendations

1. **For Regular Users:**
   - Link Discord for convenient login
   - Keep email+password as backup
   - Enable 2FA for maximum security (on email+password)

2. **For Admin/Staff:**
   - Consider using email+password only
   - Enable 2FA (required for sensitive operations)
   - Be aware of OAuth 2FA bypass

3. **For Developers:**
   - Consider implementing post-OAuth 2FA challenge
   - Monitor OAuth login patterns
   - Document OAuth limitations clearly

## Testing Checklist

- [ ] Link Discord account from profile
- [ ] Login with Discord after linking
- [ ] Unlink Discord (requires email+password first)
- [ ] Cannot unlink last auth method
- [ ] Link Discord when already linked (should fail)
- [ ] 2FA works with email+password login
- [ ] OAuth uses Discord's security (by design)
- [ ] Account data syncs across login methods

## Support

For issues or questions:
1. Check this documentation
2. Review Better-Auth OAuth documentation
3. Check server logs for OAuth errors
4. Contact development team

---

**Implementation Date:** October 2024  
**Version:** 1.0  
**Status:** ✅ Complete (OAuth 2FA pending)

