# Profile Page - User Self-Service Management

## ✅ STATUS: COMPLETED & ENHANCED (October 2025)

A comprehensive profile management system with **advanced security features**, session monitoring, 2FA, connected accounts, and API key management. Allows all users to manage their account information, security settings, and integrations.

---

## 🔐 Permission Requirements

### Access Control

The profile page is accessible to **all authenticated users** with varying features based on permissions.

#### Default Access

| Feature | Permission | All Users | Notes |
|---------|-----------|-----------|-------|
| **View Profile** | N/A | ✅ | All authenticated users |
| **Edit Profile** | N/A | ✅ | Own data only |
| **Manage Sessions** | `sessions:view_own` | ✅ | View own sessions |
| **Revoke Sessions** | `sessions:revoke_own` | ✅ | Revoke own sessions |
| **View Session Risk** | `sessions:view_own` | ✅ | See own risk scores |
| **Export Session Data** | `sessions:view_own` | ✅ | Export own data |
| **Manage API Keys** | Default | ✅ | Own API keys only |

**Note:** All users can access the profile page and manage their own data. Admin-level features require elevated permissions (see [Staff Management](./STAFF_MANAGEMENT.md)).

---

## Overview

The profile page provides comprehensive self-service tools to:
- **Update personal information** (name, email, timezone)
- **Link Minecraft accounts** with LuckPerms validation
- **Change passwords** securely
- **Enable Two-Factor Authentication (2FA)** for enhanced security
- **Connect external accounts** (Discord, Google)
- **Manage active sessions** with advanced monitoring
- **View session security & risk scores** in real-time
- **Export session history** for audit/compliance
- **Manage API keys** for programmatic access
- **Monitor device fingerprints** and trust levels
- **View LuckPerms permissions** (if Minecraft account linked)

---

## Features

### 1. Profile Information
- ✅ Edit name and email address
- ✅ View current role (read-only)
- ✅ Email verification status indicator
- ✅ Real-time form validation
- ✅ Success/error feedback messages

### 2. Minecraft Account Linking
- ✅ Link Minecraft username to staff account
- ✅ **LuckPerms database validation** - usernames must exist on the server
- ✅ Display Minecraft UUID and primary group
- ✅ Show all permission groups
- ✅ Unlink Minecraft account
- ✅ Prevents duplicate linking

### 3. Password Management
- ✅ Change password with current password verification
- ✅ Password strength indicator (weak/medium/strong)
- ✅ Password matching validation
- ✅ Toggle password visibility
- ✅ Form reset after successful change

### 4. Advanced Session Management 🔒
**Enhanced with enterprise-grade security features:**

#### Basic Session Features
- ✅ View all active sessions across devices
- ✅ Device type detection (Desktop/Mobile/Tablet/Bot)
- ✅ Browser and OS identification
- ✅ IP address display with geolocation (country, city)
- ✅ Session creation and expiration dates
- ✅ Revoke individual sessions
- ✅ Bulk revoke all other sessions
- ✅ Current session protection (cannot revoke current session)

#### Advanced Security Features 🛡️
- ✅ **Device Fingerprinting** - Unique device identification (canvas, audio, WebGL)
- ✅ **Risk Scoring** - Real-time AI-powered risk assessment (0-100 scale)
- ✅ **Trust Levels** - Session classification (New, Recognized, Trusted)
- ✅ **Threat Detection** - VPN detection, impossible travel, brute force
- ✅ **Session Timeline** - Visual activity timeline
- ✅ **Real-time Monitoring** - Live session activity with anomaly detection
- ✅ **Session Comparison** - Detect potential takeovers
- ✅ **Export Capability** - Download session history (CSV/JSON/PDF/XLSX)
- ✅ **Suspicious Activity Alerts** - Automatic flagging of unusual behavior
- ✅ **IP Geolocation** - Track session locations on map

#### Session Analytics 📊
- ✅ Session duration tracking
- ✅ Activity patterns analysis
- ✅ Login frequency metrics
- ✅ Device usage statistics
- ✅ Geographic distribution

### 5. Admin/Staff Access (Role-Based)
- ✅ **Quick dashboard access** for OWNER/ADMIN/MODERATOR/STAFF roles
- ✅ Prominent "Open Dashboard" button in sidebar
- ✅ Gradient card design for visibility
- ✅ Role-specific messaging (Admin vs Staff)
- ✅ Only visible to users with staff permissions
- ✅ Direct link to `/admin/dashboard`

### 6. Two-Factor Authentication (2FA) 🔐
**TOTP-based authentication for enhanced security:**
- ✅ Enable/disable 2FA
- ✅ QR code generation for authenticator apps
- ✅ Backup codes generation (10 one-time codes)
- ✅ Recovery codes management
- ✅ Verification before enabling
- ✅ 6-digit OTP support
- ✅ Works with Google Authenticator, Authy, 1Password, etc.

**See [Two-Factor Auth Documentation](../authentication/TWO_FACTOR_AUTH.md) for complete guide.**

### 7. Connected Accounts 🔗
**Link external accounts for easier sign-in:**
- ✅ **Discord** - Link Discord account for social login
- ✅ **Google** - Link Google account for OAuth
- ✅ Account linking/unlinking
- ✅ View linked account status
- ✅ Primary account protection
- ✅ Multiple provider support

**See [Connected Accounts Documentation](../authentication/CONNECTED_ACCOUNTS.md) for complete guide.**

### 8. API Key Management 🔑
**Generate API keys for programmatic access:**
- ✅ Create API keys with custom names
- ✅ Set expiration dates
- ✅ Configure rate limits
- ✅ Define scopes/permissions
- ✅ View usage statistics
- ✅ Revoke keys anytime
- ✅ Key rotation support
- ✅ Last used tracking

**See [API Keys Documentation](../integrations/API_KEYS.md) for complete guide.**

### 9. Account Stats Overview
- ✅ Role display with permission count
- ✅ Email verification status
- ✅ 2FA enabled status
- ✅ Minecraft link status
- ✅ Connected accounts count
- ✅ Active session count
- ✅ Total API keys
- ✅ Member since date
- ✅ Account security score

### 10. Minecraft Avatar Integration
- ✅ **Displays Minecraft skin avatar** if account is linked
- ✅ Uses Crafatar API for high-quality 3D avatars
- ✅ Shows user's actual in-game skin with overlay
- ✅ Graceful fallback to gradient avatar if image fails
- ✅ Blue border highlighting for Minecraft avatars
- ✅ Automatic switching when linking/unlinking account

---

## File Structure

```
app/profile/
├── page.tsx                              # Main profile page (server component)
└── components/
    ├── ProfileContent.tsx                # Main client wrapper
    ├── sections/
    │   ├── ProfileSection.tsx            # Profile information editor
    │   ├── SecuritySection.tsx           # Security features (2FA, sessions)
    │   ├── MinecraftSection.tsx          # Minecraft account linking
    │   ├── ConnectedAccountsSection.tsx  # OAuth accounts
    │   └── ApiKeysSection.tsx            # API key management
    ├── DeviceFingerprint.tsx             # Device fingerprinting component
    ├── SessionRiskDashboard.tsx          # Risk scoring visualization
    ├── RealtimeSessionMonitor.tsx        # Live session monitoring
    ├── SessionConflictDetector.tsx       # Takeover detection
    └── SessionExportTools.tsx            # Export session data

components/admin/
├── Sidebar.tsx                           # Updated with "My Profile" link
└── AdminChrome.tsx                       # Updated command palette
```

---

## Server Actions

### `updateProfileAction(formData)`
Updates user's name and email address.

**Validations:**
- Name and email are required
- Email format validation
- Email uniqueness check (excluding current user)

**Returns:**
```typescript
{ success: boolean; message: string }
```

### `updateMinecraftAction(formData)`
Links or unlinks Minecraft username.

**Validations:**
- Username format (3-16 characters, alphanumeric + underscores)
- **LuckPerms database validation** - must exist on server
- Username uniqueness check (across all staff accounts)

**Returns:**
```typescript
{ success: boolean; message: string; uuid?: string }
```

### `changePasswordAction(formData)`
Changes user's password.

**Validations:**
- All fields required
- Current password verification
- New passwords must match
- Minimum 8 characters

**Returns:**
```typescript
{ success: boolean; message: string }
```

### `deleteSessionAction(formData)`
Revokes an active session.

**Validations:**
- Session ID required
- Session ownership verification
- Cannot revoke current session

**Returns:**
```typescript
{ success: boolean; message: string }
```

---

## Navigation

### Sidebar
- **Location:** System section (below Management, above Settings)
- **Icon:** User icon
- **Label:** "My Profile"
- **Accessible to:** All authenticated users

### Command Palette
- **Group:** Settings
- **Keywords:** account, personal, minecraft, password
- **Shortcut:** Search for "profile" or "account"

---

## Security Features

### Authentication
- ✅ Requires active session
- ✅ Redirects to login if not authenticated
- ✅ All actions verify user ownership

### Data Protection
- ✅ Users can only edit their own profile
- ✅ Role changes require admin action
- ✅ Password hashing with bcrypt
- ✅ Current password verification for password changes
- ✅ Session ownership verification for revocation

### Validation
- ✅ Server-side validation on all actions
- ✅ Client-side validation for better UX
- ✅ Email format and uniqueness checks
- ✅ Minecraft username format and LuckPerms validation
- ✅ Password strength requirements

---

## Usage Examples

### Access the Profile Page

**Via Sidebar:**
1. Log in to admin dashboard
2. Scroll to "System" section in sidebar
3. Click "My Profile"

**Via Command Palette:**
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
2. Type "profile" or "account"
3. Press Enter

### Link Minecraft Account

1. Navigate to "My Profile"
2. Scroll to "Minecraft Account" section
3. Enter your Minecraft username
4. Click "Link Account"
5. System validates against LuckPerms database
6. Success! View your permissions and groups

### Change Password

1. Navigate to "My Profile"
2. Scroll to "Change Password" section
3. Enter current password
4. Enter new password (min 8 characters)
5. Confirm new password
6. Click "Change Password"
7. Success! Password updated

### Manage Sessions

1. Navigate to "My Profile"
2. Scroll to "Active Sessions" section
3. View all devices where you're logged in
4. Click "Revoke" on any session (except current)
5. That device will be logged out immediately

---

## Component Details

### ProfileForm
**Props:**
- `user`: { name, email, role, emailVerified }
- `action`: Server action function

**Features:**
- Role badge display with appropriate color
- Email verification status
- Form validation
- Success/error messaging

### PasswordChangeForm
**Props:**
- `action`: Server action function

**Features:**
- Password visibility toggles for all fields
- Real-time password strength indicator
- Password match validation
- Form reset on success

### MinecraftLinkForm
**Props:**
- `currentUsername`: Current Minecraft username or null
- `permissions`: LuckPerms permissions data
- `action`: Server action function

**Features:**
- Link/unlink toggle
- LuckPerms validation
- UUID and primary group display
- Permission groups display
- Informative help text

### SessionsList
**Props:**
- `sessions`: Array of session objects
- `currentSessionToken`: Current session identifier
- `deleteAction`: Server action function

**Features:**
- Device type icons (Desktop/Mobile/Tablet)
- Browser and OS detection
- Current session highlighting
- Expired session indicators
- Session revocation with confirmation

---

## LuckPerms Integration

The profile page integrates with the LuckPerms database to:

1. **Validate Usernames:** Ensures Minecraft usernames exist on the server
2. **Display Permissions:** Shows player's primary group and all groups
3. **Prevent Conflicts:** Checks for duplicate username linking

**Example Validation Flow:**
```typescript
// User enters "Steve123"
1. Format check (3-16 chars, alphanumeric + underscore)
2. LuckPerms database query
3. Player found? ✅ Get UUID and primaryGroup
4. Player not found? ❌ Show error
5. Already linked to another account? ❌ Show error
6. Success! Link account and display permissions
```

---

## Styling & UI

### Layout Design
- **Two-column grid layout** on large screens (3-column grid with 2:1 ratio)
- **Left column (2/3 width):** Main settings (Profile, Password, Sessions)
- **Right column (1/3 width):** Sidebar with Minecraft and Quick Stats
- **Single column** on mobile for optimal mobile experience
- **Profile header** with gradient avatar and user info
- **Compact cards** with better visual hierarchy

### Design System
- Uses common component library (Button, Input, Label, Badge, Card)
- Consistent with admin dashboard design
- Fully responsive (mobile-friendly)
- Dark mode support
- Gradient avatar in header
- Status badges with appropriate colors

### Visual Indicators
- ✅ Green for success states
- 🔴 Red for error states
- 🔵 Blue for info/current states
- 🟡 Amber for warnings
- 🎨 Gradient avatar (blue to purple)

### Icons
- `User` - Profile information
- `Gamepad2` - Minecraft account
- `Key` - Password management
- `Shield` - Active sessions
- `Monitor/Smartphone/Tablet` - Device types

---

## Error Handling

### Common Errors

**Email Already in Use:**
```
Message: "This email is already in use"
Solution: Use a different email address
```

**Minecraft Username Not Found:**
```
Message: "Minecraft username validation failed: Player not found in LuckPerms database"
Solution: Ensure you've joined the server at least once with that username
```

**Incorrect Current Password:**
```
Message: "Current password is incorrect"
Solution: Verify you're entering your current password correctly
```

**Passwords Don't Match:**
```
Message: "New passwords do not match"
Solution: Ensure both password fields contain the same value
```

---

## Testing Checklist

### Profile Information
- [ ] Update name successfully
- [ ] Update email successfully
- [ ] Email uniqueness validation works
- [ ] Email format validation works
- [ ] Role is displayed correctly (read-only)
- [ ] Email verification status shows correctly

### Minecraft Linking
- [ ] Link valid Minecraft username
- [ ] Validation fails for non-existent username
- [ ] Validation fails for invalid format
- [ ] Cannot link username already taken
- [ ] Display UUID and primary group
- [ ] Display all permission groups
- [ ] Unlink Minecraft account

### Password Change
- [ ] Change password successfully
- [ ] Current password verification works
- [ ] New password validation (min 8 chars)
- [ ] Password matching validation
- [ ] Password strength indicator works
- [ ] Form resets after success

### Session Management
- [ ] View all active sessions
- [ ] Device detection works correctly
- [ ] Current session highlighted
- [ ] Cannot revoke current session
- [ ] Can revoke other sessions
- [ ] Revoked session logs out immediately

---

## Recent Enhancements ✅

### Implemented Features (October 2025)

#### Security Features (Complete)
- ✅ **Two-factor authentication (2FA)** - TOTP-based with backup codes
- ✅ **Advanced session management** - Real-time monitoring, risk scoring
- ✅ **Device fingerprinting** - Unique device identification
- ✅ **Threat detection** - VPN, impossible travel, brute force detection
- ✅ **Session export** - Audit trail export (CSV/JSON/PDF/XLSX)
- ✅ **Login history** - Complete activity timeline

#### Integration Features (Complete)
- ✅ **Discord account linking** - OAuth integration
- ✅ **Google account linking** - OAuth integration
- ✅ **API key management** - Full API access control
- ✅ **Connected accounts** - Multiple provider support

#### Profile Features (Complete)
- ✅ **Timezone preference** - User-specific timezone
- ✅ **Session analytics** - Activity patterns and metrics
- ✅ **Risk scoring** - AI-powered security assessment
- ✅ **Real-time monitoring** - Live session activity

## Future Enhancements

### Phase 1: Additional Features
- [ ] Profile picture upload (custom avatars)
- [ ] Custom bio/description
- [ ] Notification preferences (email, push)
- [ ] Email notification management

### Phase 2: Social Features
- [ ] Steam account linking
- [ ] Additional OAuth providers (GitHub, Twitter)
- [ ] Social media profile connections
- [ ] Friend/colleague connections

### Phase 3: Analytics
- [ ] Personal activity dashboard
- [ ] Contribution statistics
- [ ] Event participation history
- [ ] Performance metrics (for staff)
- [ ] Usage analytics

### Phase 4: Advanced Security
- [ ] Security questions setup
- [ ] Account recovery options (additional)
- [ ] Biometric authentication (WebAuthn)
- [ ] Hardware key support (YubiKey)
- [ ] Security audit log (detailed)

---

## Success! 🎉

Your profile management system is **feature-complete** with enterprise-grade security! Users can:
- ✅ Manage their own information
- ✅ Link Minecraft accounts with LuckPerms validation
- ✅ Change passwords securely
- ✅ **Enable Two-Factor Authentication (2FA)**
- ✅ **Connect external accounts** (Discord, Google)
- ✅ **Manage API keys** for programmatic access
- ✅ **Monitor sessions** with advanced security features
- ✅ **View risk scores** and threat detection
- ✅ **Export session data** for compliance
- ✅ **Track device fingerprints** and trust levels

**Try it now:**
1. Log in to the dashboard
2. Click "My Profile" in the sidebar
3. Explore the enhanced security features!

---

## Related Documentation

- **[Two-Factor Authentication](../authentication/TWO_FACTOR_AUTH.md)** - Complete 2FA guide
- **[Connected Accounts](../authentication/CONNECTED_ACCOUNTS.md)** - OAuth integration guide
- **[API Keys Management](../integrations/API_KEYS.md)** - API access documentation
- **[Advanced Session Management](../session-management/ADVANCED_SESSION_MANAGEMENT.md)** - Session security features
- **[Session Management Summary](../session-management/SESSION_MANAGEMENT_SUMMARY.md)** - Implementation details
- **[RBAC Permission System](../rbac-permissions/RBAC_SYSTEM.md)** - Permission model
- **[Staff Management](./STAFF_MANAGEMENT.md)** - Admin staff management

---

**Last Updated:** October 25, 2025  
**Status:** ✅ Complete with Advanced Features  
**Security Level:** 🔒🔒🔒🔒🔒 (5/5 - Enterprise Grade)

