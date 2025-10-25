# Cast Member (Staff) Management System

## Overview

A comprehensive staff management system for creating and managing Cast Member (staff) accounts with Minecraft username linking and LuckPerms integration.

---

## 🔐 Permission Requirements

### Access Control

This feature implements **RBAC permission checks** for staff management operations.

#### Required Permissions

| Operation | Permission | OWNER | ADMIN | MODERATOR | STAFF | USER |
|-----------|-----------|-------|-------|-----------|-------|------|
| **View Staff Page** | `users:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create Staff** | `users:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Update Staff** | `users:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete Staff** | `users:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Default Access

- **👑 OWNER** - Full staff management access
- **🛡️ ADMIN** - Full staff management access
- **⚖️ MODERATOR** - Read-only access (can view staff list)
- **👔 STAFF** - No access to staff management
- **👤 USER** - No access to staff management

#### Custom Roles

Custom roles can be granted staff management permissions:
- Navigate: **Admin → User Roles → Configure Roles**
- Check "Users" category
- Select specific operations (create, read, update, delete)

**Example Use Cases:**
- **HR Team:** Grant `users:create` + `users:update` only (cannot delete)
- **Audit Team:** Grant `users:read` only (view-only access)
- **Department Managers:** Grant `users:create` + `users:read` (can add but not delete)

### Security Features

✅ **Operation-level checks** - Each action validates specific permission  
✅ **Self-protection** - Cannot delete your own account (even with permission)  
✅ **Owner protection** - Cannot delete last owner account  
✅ **Role hierarchy** - Permissions respect role levels  
✅ **Audit logging** - All operations logged for security  

---

**See Also:**
- [RBAC Permission Enforcement](../rbac-permissions/RBAC_PERMISSION_ENFORCEMENT.md) - Complete guide
- [Bulk User Management](./BULK_USER_MANAGEMENT.md) - For managing multiple users at once

---

## Features

### ✅ Staff Account Creation
- Create new staff accounts with email/password authentication
- Assign roles (Owner, Admin, Moderator, Staff)
- Link Minecraft usernames to staff accounts
- Automatic password hashing and security
- Email verification support

### ✅ Minecraft Username Linking
- Validate Minecraft username format (3-16 chars, alphanumeric + underscores)
- Prevent duplicate Minecraft usernames
- Optional Mojang API validation
- Display Minecraft usernames in staff list

### ✅ Role Management

Each role has specific permissions defined by the RBAC system:

- **👑 Owner**: Complete system control (all 35 permissions)
- **🛡️ Admin**: Full administrative access (34 permissions, cannot bulk change roles)
- **⚖️ Moderator**: Manage players and moderate content (13 permissions, read-mostly)
- **👔 Staff**: Basic staff member with limited permissions (9 permissions)
- **👤 User**: Regular user permissions (2 permissions, own data only)

**See [RBAC System](../rbac-permissions/RBAC_SYSTEM.md) for complete permission breakdown.**

**Custom Roles:** You can create custom roles with any combination of the 35 available permissions via **Admin → User Roles → Configure Roles**.

### ✅ Staff Dashboard
- View all staff members with their details
- Search and filter by name, email, or Minecraft username
- Filter by role
- See activity stats (events created, applications processed)
- Track login sessions

### ✅ Security Features
- Bcrypt password hashing
- Prevent self-deletion
- Prevent deleting last owner account
- Email uniqueness validation
- Secure server actions with authentication

### ✅ LuckPerms Integration (Optional)
- Validate Minecraft usernames via Mojang API or LuckPerms
- Sync web roles to Minecraft server groups
- Check player permissions from LuckPerms
- Find all players in specific groups

---

## File Structure

```
app/admin/staff/
├── page.tsx                          # Main staff management page (server component)
├── components/
│   ├── CreateStaffForm.tsx          # Form to create new staff members (client)
│   └── StaffList.tsx                 # List and manage existing staff (client)

lib/
└── luckperms.ts                      # LuckPerms integration utilities

components/admin/
├── Sidebar.tsx                       # Updated with Cast Members nav link
└── AdminChrome.tsx                   # Updated command palette
```

---

## Usage

### Creating a New Cast Member

1. Navigate to **Admin → Cast Members** in the sidebar
2. Fill out the "Add New Cast Member" form:
   - **Full Name**: Staff member's display name
   - **Email Address**: Login email (must be unique)
   - **Minecraft Username**: (Optional) Their MC username
   - **Role**: Select appropriate permission level
   - **Initial Password**: Generate or manually create (min 8 chars)
3. Click "Create Cast Member"
4. Share the login credentials securely with the new staff member

### Managing Existing Staff

1. View all staff in the "All Cast Members" table
2. **Search**: Filter by name, email, or Minecraft username
3. **Filter by Role**: Dropdown to show only specific roles
4. **Edit**: Click edit icon to update Minecraft username
5. **Delete**: Click delete icon to remove a staff member (cannot delete yourself or last owner)

### Linking Minecraft Usernames

You can link Minecraft usernames in two ways:

**During Creation:**
- Fill in the "Minecraft Username" field when creating a new staff member

**After Creation:**
- Click the edit icon next to a staff member
- Enter or update their Minecraft username
- Click "Save Changes"

---

## LuckPerms Integration Setup

### Option 1: Mojang API (No LuckPerms Required)

The system uses the Mojang API by default to validate Minecraft usernames. This requires no additional setup and works out of the box.

### Option 2: LuckPerms REST API

If you want to integrate directly with your Minecraft server's LuckPerms:

1. **Install LuckPerms REST API Extension**
   - Add the LuckPerms REST API plugin to your server
   - Configure the API endpoint and authentication

2. **Add Environment Variables**
   ```env
   LUCKPERMS_API_URL=https://your-server.com/luckperms/api
   LUCKPERMS_API_KEY=your-secret-api-key
   ```

3. **Uncomment LuckPerms Functions**
   - Open `lib/luckperms.ts`
   - Uncomment the REST API calls you want to use
   - Comment out the Mojang API fallback if desired

4. **Sync Roles to Minecraft**
   - Call `syncRoleToMinecraft(minecraftName, webRole)` when creating/updating staff
   - This will automatically add them to the appropriate group on your server

### Option 3: Direct Database Access

If you have direct access to your Minecraft server's MySQL database:

1. **Add Database Connection**
   ```env
   MINECRAFT_DATABASE_URL=mysql://user:pass@localhost:3306/minecraft
   ```

2. **Update Prisma Schema**
   - Add LuckPerms tables to your Prisma schema
   - Generate Prisma client

3. **Use Database Queries**
   - Uncomment `validateUsernameViaDatabase()` in `lib/luckperms.ts`
   - Query LuckPerms tables directly

---

## API Reference

### Server Actions

#### `createStaffAction(formData: FormData)`
Creates a new staff member account.

**Parameters:**
- `name`: Full name
- `email`: Email address (unique)
- `minecraftName`: Minecraft username (optional, validated)
- `role`: Staff role (OWNER, ADMIN, MODERATOR, STAFF)
- `password`: Initial password (min 8 chars)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  userId?: string;
}
```

#### `updateStaffAction(formData: FormData)`
Updates an existing staff member's Minecraft username and/or role.

**Parameters:**
- `userId`: Staff member ID
- `minecraftName`: New Minecraft username (optional)
- `role`: New role (optional)

#### `deleteStaffAction(formData: FormData)`
Deletes a staff member account.

**Parameters:**
- `userId`: Staff member ID

**Restrictions:**
- Cannot delete yourself
- Cannot delete the last owner

---

## LuckPerms Utility Functions

### `isLuckPermsEnabled()`
Check if LuckPerms integration is configured.

### `validateMinecraftUsername(username: string)`
Validate a Minecraft username exists.

**Returns:**
```typescript
{
  valid: boolean;
  uuid?: string;
  error?: string;
}
```

### `getPlayerPermissions(username: string)`
Get a player's permissions and groups from LuckPerms.

**Returns:**
```typescript
{
  success: boolean;
  groups?: string[];
  permissions?: string[];
  error?: string;
}
```

### `syncRoleToMinecraft(minecraftName: string, webRole: string)`
Sync a staff member's web role to their Minecraft server group.

**Role Mapping:**
- `OWNER` → `owner`
- `ADMIN` → `admin`
- `MODERATOR` → `moderator`
- `STAFF` → `staff`
- `USER` → `default`

### `getPlayersWithGroup(groupName: string)`
Get all players in a specific LuckPerms group.

---

## Security Considerations

### Password Security
- Passwords are hashed with bcrypt (10 rounds)
- Stored in `Account.password` field (Better-Auth standard)
- Never logged or displayed after creation
- Minimum 8 characters required
- Password strength indicator in UI

### Email Validation
- Format validation with regex
- Uniqueness check before creation
- Email verification in production (Better-Auth)

### Minecraft Username Validation
- Format: 3-16 characters, alphanumeric and underscores only
- Uniqueness: One MC username per account
- Optional API validation (Mojang or LuckPerms)
- Fails open if validation API is down

### Role-Based Access Control (RBAC)

The system implements **granular RBAC permissions**:

- **Page Access:** Requires `users:read` permission minimum
- **Create Operations:** Requires `users:create` permission
- **Update Operations:** Requires `users:update` permission  
- **Delete Operations:** Requires `users:delete` permission
- **Role hierarchy** prevents privilege abuse
- **Cannot delete last owner** account (system protection)
- **Cannot delete yourself** (even with permission)
- **Custom roles supported** - Grant specific permissions as needed

**Permission Enforcement:**
- ✅ Server-side validation on every request
- ✅ Type-safe with TypeScript
- ✅ Clear error messages (shows which permission missing)
- ✅ Audit logging enabled
- ✅ Fails closed (denies on error)

**For advanced user management**, see [Bulk User Management](./BULK_USER_MANAGEMENT.md) for operations on multiple users at once.

### Audit Trail
- Track created events per staff member
- Track created applications per staff member
- Session tracking (active/inactive)
- Timestamps for creation and updates

---

## Statistics Dashboard

The staff page displays real-time statistics:

- **Total Staff**: Number of staff members
- **Linked to MC**: Staff with Minecraft usernames
- **Email Verified**: Staff who verified their email
- **Active Sessions**: Staff currently logged in

---

## Command Palette Integration

Access staff management quickly via the Command Palette (⌘K):

**Search:** "Cast Members", "staff", "minecraft", or "team"

**Quick Actions:**
- "Cast Members" → Navigate to staff page
- Plus many other admin shortcuts

---

## Recent Enhancements ✅

### Implemented Features (October 2025)
- ✅ **Bulk User Management** - Manage multiple users at once ([see docs](./BULK_USER_MANAGEMENT.md))
- ✅ **Two-factor authentication (2FA)** - TOTP-based 2FA ([see docs](../authentication/TWO_FACTOR_AUTH.md))
- ✅ **Granular RBAC Permissions** - 35 permissions for fine-grained access control
- ✅ **Custom Role Creation** - Create roles with specific permission combinations
- ✅ **Discord Integration** - Link Discord accounts ([see docs](../authentication/CONNECTED_ACCOUNTS.md))
- ✅ **Advanced Session Management** - Monitor and control user sessions ([see docs](../session-management/))

## Future Enhancements

### Potential Features
- [ ] Bulk import staff from CSV with preview
- [ ] Send email invitations with magic links
- [ ] Permission inheritance from MC groups
- [ ] Automatic role sync on MC server join
- [ ] Staff activity timeline (detailed view)
- [ ] Staff performance metrics and KPIs
- [ ] Temporary staff accounts (auto-expire)
- [ ] Staff onboarding checklist and workflow
- [ ] Department/team grouping
- [ ] Shift scheduling integration

### LuckPerms Advanced
- [ ] Real-time permission sync
- [ ] Webhook notifications on role changes
- [ ] Parent group inheritance
- [ ] Per-world permissions
- [ ] Timed permissions/groups
- [ ] Permission context (server, world, etc.)

---

## Troubleshooting

### Issue: "Email already exists"
**Solution:** The email is already registered. Use a different email or update the existing account.

### Issue: "Minecraft username already linked"
**Solution:** That username is already linked to another account. Each MC username can only be linked once.

### Issue: "Invalid Minecraft username format"
**Solution:** Must be 3-16 characters, alphanumeric and underscores only. No spaces or special characters.

### Issue: "Cannot delete last owner"
**Solution:** There must always be at least one owner account. Promote another staff member to owner first.

### Issue: LuckPerms API not working
**Solution:** 
1. Check `LUCKPERMS_API_URL` and `LUCKPERMS_API_KEY` in `.env`
2. Verify the LuckPerms REST API plugin is installed on your server
3. Check server logs for connection errors
4. The system will fall back to Mojang API if LuckPerms is unavailable

---

## Database Schema

The staff system uses the existing `User` and `Account` tables from Better-Auth:

```prisma
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String?  @unique
  minecraftName String?  // Minecraft username
  role          String   @default("USER")  // OWNER, ADMIN, MODERATOR, STAFF, USER
  emailVerified Boolean? @default(false)
  // ... other fields
}

model Account {
  id         String  @id @default(cuid())
  userId     String
  providerId String  // "credential" for email/password
  password   String? @db.Text  // Hashed password
  // ... other fields
}
```

---

## Credits

**Built with:**
- Better-Auth (Authentication)
- Prisma (Database)
- Next.js 15 (Framework)
- React Server Components
- Bcrypt (Password hashing)
- Mojang API (MC validation)
- LuckPerms (Optional integration)

**Last Updated:** October 25, 2025  
**Maintainer:** Development Team

---

## Related Documentation

- **[Bulk User Management](./BULK_USER_MANAGEMENT.md)** - Manage multiple users at once
- **[RBAC Permission System](../rbac-permissions/RBAC_SYSTEM.md)** - Complete permission guide
- **[Role Configuration UI](../rbac-permissions/ROLE_CONFIGURE_UI_UPDATE.md)** - How to configure roles
- **[Two-Factor Auth](../authentication/TWO_FACTOR_AUTH.md)** - 2FA implementation
- **[Connected Accounts](../authentication/CONNECTED_ACCOUNTS.md)** - OAuth & Discord linking
- **[Session Management](../session-management/)** - Advanced session features

