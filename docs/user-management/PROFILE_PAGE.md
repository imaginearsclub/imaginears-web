# Profile Page - User Self-Service Management

## ✅ STATUS: COMPLETED & WORKING

A comprehensive profile management system that allows all staff members to manage their own account information, link Minecraft accounts, change passwords, and manage active sessions.

---

## Overview

The profile page provides staff members with self-service tools to:
- **Update personal information** (name, email)
- **Link Minecraft accounts** with LuckPerms validation
- **Change passwords** securely
- **Manage active sessions** across devices
- **View LuckPerms permissions** (if Minecraft account is linked)

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

### 4. Session Management
- ✅ View all active sessions
- ✅ Device type detection (Desktop/Mobile/Tablet)
- ✅ Browser and OS identification
- ✅ IP address display
- ✅ Session creation and expiration dates
- ✅ Revoke individual sessions
- ✅ Current session protection (cannot revoke current session)

### 5. Admin/Staff Access (Role-Based)
- ✅ **Quick dashboard access** for OWNER/ADMIN/MODERATOR/STAFF roles
- ✅ Prominent "Open Dashboard" button in sidebar
- ✅ Gradient card design for visibility
- ✅ Role-specific messaging (Admin vs Staff)
- ✅ Only visible to users with staff permissions
- ✅ Direct link to `/admin/dashboard`

### 6. Account Stats Overview
- ✅ Role display
- ✅ Email verification status
- ✅ Minecraft link status
- ✅ Active session count
- ✅ Member since date

### 7. Minecraft Avatar Integration
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
    ├── ProfileForm.tsx                   # Profile information editor
    ├── PasswordChangeForm.tsx            # Password change form
    ├── MinecraftLinkForm.tsx             # Minecraft account linking
    └── SessionsList.tsx                  # Active sessions manager

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

## Future Enhancements

### Phase 1: Enhanced Profile
- [ ] Profile picture upload
- [ ] Custom bio/description
- [ ] Timezone preference
- [ ] Notification preferences

### Phase 2: Security
- [ ] Two-factor authentication (2FA)
- [ ] Login history log
- [ ] Security question setup
- [ ] Account recovery options

### Phase 3: Integrations
- [ ] Discord account linking
- [ ] Steam account linking
- [ ] Social media connections
- [ ] API key management

### Phase 4: Analytics
- [ ] Activity dashboard
- [ ] Contribution statistics
- [ ] Event participation history
- [ ] Staff performance metrics

---

## Success! 🎉

Your profile management system is now complete! Staff members can:
- ✅ Manage their own information
- ✅ Link Minecraft accounts with LuckPerms validation
- ✅ Change passwords securely
- ✅ Manage active sessions

**Try it now:**
1. Log in to the admin dashboard
2. Click "My Profile" in the sidebar
3. Explore all the features!

