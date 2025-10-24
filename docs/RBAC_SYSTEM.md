# Role-Based Access Control (RBAC) System

## Overview

The Imaginears platform uses a simple, powerful RBAC system built directly into the user model. This eliminates the complexity of multi-tenant organizations while providing granular permission control.

## Architecture

### User Roles (Hierarchy)

```
OWNER > ADMIN > MODERATOR > STAFF > USER
```

| Role | Description | Use Case |
|------|-------------|----------|
| **OWNER** | Full system access | Site owner, can manage everything including critical security settings |
| **ADMIN** | Administrative access | Trusted administrators, can manage most features except critical security |
| **MODERATOR** | Content management | Can manage events, applications, and players |
| **STAFF** | Limited editing | Can view and assist, limited editing capabilities |
| **USER** | Basic access | Standard authenticated user |

### Permission System

Permissions follow the pattern: `resource:action`

**Available Permissions:**

**Events:**
- `events:read` - View events
- `events:write` - Create/edit events
- `events:delete` - Delete events
- `events:publish` - Publish events

**Applications:**
- `applications:read` - View applications
- `applications:write` - Edit applications
- `applications:delete` - Delete applications
- `applications:approve` - Approve/reject applications

**Players:**
- `players:read` - View player data
- `players:write` - Edit player data
- `players:ban` - Ban/unban players

**Users:**
- `users:read` - View user list
- `users:write` - Edit user details
- `users:delete` - Delete users
- `users:manage_roles` - Change user roles

**Settings:**
- `settings:read` - View settings
- `settings:write` - Modify settings
- `settings:security` - Access security settings

**Dashboard:**
- `dashboard:view` - Access admin dashboard
- `dashboard:stats` - View statistics

**System:**
- `system:maintenance` - Enable/disable maintenance mode
- `system:logs` - View system logs

### Database Schema

```prisma
model User {
  id            String       @id @default(cuid())
  name          String?
  email         String?      @unique
  role          UserRole     @default(USER)
  permissions   Json?        // Custom permissions override
  // ... other fields
}

enum UserRole {
  OWNER      // Full system access
  ADMIN      // Can manage most features
  MODERATOR  // Can manage events, applications, players
  STAFF      // Can view and assist, limited editing
  USER       // Basic authenticated access
}
```

## Usage

### Requiring Admin Access

```typescript
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) {
    redirect("/login");
  }

  // User is authenticated and has OWNER or ADMIN role
  // session.user.role contains the user's role
}
```

### Requiring Specific Permissions

```typescript
import { requirePermission } from "@/lib/session";

export async function deleteEventAction() {
  "use server";
  
  const session = await requirePermission("events:delete");
  if (!session) {
    throw new Error("Unauthorized");
  }

  // User has events:delete permission
  await prisma.event.delete({ ... });
}
```

### Getting Current User

```typescript
import { getCurrentUser } from "@/lib/session";

const user = await getCurrentUser();
if (user) {
  console.log(user.role); // UserRole
  console.log(user.permissions); // Custom permissions
}
```

### Client-Side Permission Checks

```typescript
import { userHasPermission, getRolePermissions } from "@/lib/rbac";

// Check if user has permission
const canDelete = userHasPermission(
  user.role,
  "events:delete",
  user.permissions
);

// Get all permissions for a role
const permissions = getRolePermissions("MODERATOR");
```

### Role Utilities

```typescript
import {
  isAdminRole,
  isStaffRole,
  getRoleLabel,
  getRoleDescription,
  getRoleBadgeVariant,
} from "@/lib/rbac";

// Check role level
if (isAdminRole(user.role)) {
  // User is OWNER or ADMIN
}

if (isStaffRole(user.role)) {
  // User is OWNER, ADMIN, MODERATOR, or STAFF
}

// Get display info
const label = getRoleLabel(user.role); // "Administrator"
const description = getRoleDescription(user.role);
const variant = getRoleBadgeVariant(user.role); // "success"
```

## Role Permissions Matrix

| Permission | OWNER | ADMIN | MODERATOR | STAFF | USER |
|------------|-------|-------|-----------|-------|------|
| events:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| events:write | ✅ | ✅ | ✅ | ✅ | ❌ |
| events:delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| events:publish | ✅ | ✅ | ✅ | ❌ | ❌ |
| applications:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| applications:write | ✅ | ✅ | ✅ | ✅ | ❌ |
| applications:delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| applications:approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| players:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| players:write | ✅ | ✅ | ✅ | ❌ | ❌ |
| players:ban | ✅ | ✅ | ❌ | ❌ | ❌ |
| users:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| users:write | ✅ | ✅ | ❌ | ❌ | ❌ |
| users:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:manage_roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| settings:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| settings:write | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings:security | ✅ | ❌ | ❌ | ❌ | ❌ |
| dashboard:view | ✅ | ✅ | ✅ | ✅ | ✅ |
| dashboard:stats | ✅ | ✅ | ✅ | ❌ | ❌ |
| system:maintenance | ✅ | ❌ | ❌ | ❌ | ❌ |
| system:logs | ✅ | ✅ | ❌ | ❌ | ❌ |

## Custom Permissions

Users can have custom permissions that override their role-based permissions. This is stored in the `permissions` JSON field.

### Example: Grant Custom Permission

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    permissions: {
      "events:delete": true,  // Grant permission
      "events:publish": false // Revoke permission
    }
  }
});
```

### Custom Permission Priority

1. **Custom permissions** (in user.permissions JSON) - Highest priority
2. **Role permissions** (defined in ROLE_PERMISSIONS) - Default fallback

## Role Management UI

Access the role management interface at `/admin/roles` (requires OWNER or ADMIN role).

**Features:**
- View all users and their roles
- Change user roles with confirmation
- See role hierarchy and permissions
- View active/inactive users
- Protect last OWNER from role changes

## Security Best Practices

### 1. Fail Closed
All authorization functions return `null` on error, denying access by default.

### 2. Database Validation
Roles are stored in the database and validated on every request, not just in the session.

### 3. Protected Operations
- Cannot remove the last OWNER
- Owners cannot change their own role if they're the only one
- All role changes are logged

### 4. Session Validation
Sessions are validated for:
- Expiry time
- Session age (max 24 hours)
- User existence
- Role validity

### 5. Audit Logging
Unauthorized access attempts are logged in production for monitoring.

## Migration from Organizations

The system was migrated from a complex multi-tenant organization system to simple RBAC:

**Benefits:**
- ✅ Simpler codebase (~50% less code)
- ✅ Faster queries (no org joins)
- ✅ Easier to reason about
- ✅ Better for single-tenant use cases
- ✅ More flexible permission system

**Removed:**
- ❌ Organizations model
- ❌ Teams model
- ❌ Members model
- ❌ Organization-level permissions

## Adding New Permissions

1. **Define permission in `lib/rbac.ts`:**
```typescript
export type Permission =
  // ... existing permissions
  | "new_resource:action";
```

2. **Add to role permissions:**
```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    // ... existing
    "new_resource:action",
  ],
  // ... other roles
};
```

3. **Use in code:**
```typescript
const session = await requirePermission("new_resource:action");
```

## Testing

### Test Role Checks

```typescript
import { isAdminRole, userHasPermission } from "@/lib/rbac";

describe("RBAC", () => {
  it("should identify admin roles", () => {
    expect(isAdminRole("OWNER")).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("MODERATOR")).toBe(false);
  });

  it("should check permissions correctly", () => {
    expect(userHasPermission("MODERATOR", "events:write")).toBe(true);
    expect(userHasPermission("STAFF", "events:delete")).toBe(false);
  });
});
```

## Troubleshooting

### "Unauthorized" even though I'm logged in

1. Check your role: `SELECT role FROM user WHERE email = 'your@email.com';`
2. Verify the required role for the page (OWNER/ADMIN only?)
3. Check session validity (has it expired?)

### Permissions not updating

1. Restart dev server to regenerate Prisma client
2. Clear session cookies and log in again
3. Check database to confirm role was updated

### Can't access /admin/roles

This page requires OWNER or ADMIN role. Have an existing admin grant you the role, or update directly in the database:

```sql
UPDATE user SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## Future Enhancements

Potential improvements:

- [ ] Permission groups/templates
- [ ] Time-limited role assignments
- [ ] Role change approval workflow
- [ ] Detailed audit log UI
- [ ] Role hierarchy visualization
- [ ] Bulk role assignment
- [ ] API key-based permissions
- [ ] IP-based access restrictions per role

---

**Version:** 1.0  
**Last Updated:** October 24, 2025  
**Maintainer:** Development Team

