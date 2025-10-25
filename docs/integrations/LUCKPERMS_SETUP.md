# LuckPerms Database Integration Setup Guide

## ✅ STATUS: COMPLETED & WORKING

The LuckPerms database integration has been successfully implemented and tested! Your staff management system can now:
- ✅ Validate Minecraft usernames directly against the LuckPerms database
- ✅ View player permissions and groups
- ✅ Search for players by username
- ✅ Check who has staff permissions on your server
- ✅ Test connection: Run `npm run test:luckperms` to verify everything works

---

## Overview

This guide walks you through setting up direct database access to your Minecraft server's LuckPerms data. This allows you to:
- Validate staff Minecraft usernames in real-time
- Display player permissions and groups  
- Check who has staff permissions on your server
- Eventually transition to using the LuckPerms REST API

---

## Prerequisites

- ✅ LuckPerms installed on your Minecraft server
- ✅ LuckPerms configured to use MySQL (not H2 or SQLite)
- ✅ Database credentials for your Minecraft server's MySQL database
- ✅ Network access to the MySQL database (same server or remote access enabled)

---

## Step 1: Add Database Connection String

Add the Minecraft database connection to your `.env` file:

```env
# Your existing DATABASE_URL for the web app
DATABASE_URL="mysql://user:password@localhost:3306/imaginears"

# NEW: Minecraft server database (LuckPerms)
MINECRAFT_DATABASE_URL="mysql://minecraft_user:password@minecraft-server.com:3306/minecraft"

# Optional: If your LuckPerms uses a custom table prefix
LUCKPERMS_TABLE_PREFIX="luckperms_"
```

### Finding Your Minecraft Database URL

**Option 1: Same Server**
If your Minecraft server and web app are on the same machine:
```env
MINECRAFT_DATABASE_URL="mysql://root:your_password@localhost:3306/minecraft"
```

**Option 2: Remote Server**
If your Minecraft server is on a different machine:
```env
MINECRAFT_DATABASE_URL="mysql://mc_user:password@123.456.789.0:3306/minecraft"
```

**Option 3: Using SSH Tunnel**
If you need to tunnel through SSH:
```bash
# On your local machine, create tunnel:
ssh -L 3307:localhost:3306 user@minecraft-server.com

# Then use:
MINECRAFT_DATABASE_URL="mysql://mc_user:password@localhost:3307/minecraft"
```

### LuckPerms Config Location

Your LuckPerms MySQL settings are in:
```
plugins/LuckPerms/config.yml
```

Look for:
```yaml
storage-method: MySQL
data:
  address: localhost:3306
  database: minecraft
  username: root
  password: your_password
  table-prefix: 'luckperms_'
```

---

## Step 2: Generate Prisma Client for Minecraft Database

Run these commands to set up the Prisma client:

```bash
# Generate the Minecraft Prisma client
npm run prisma:minecraft:generate

# Pull the actual schema from your database (optional but recommended)
npm run prisma:minecraft:db:pull
```

This will:
1. Generate TypeScript types for LuckPerms tables
2. Create a Prisma client at `node_modules/.prisma/minecraft-client`
3. Optionally sync the schema with your actual database structure

---

## Step 3: Test Database Connection

Create a test file to verify the connection:

```typescript
// test-minecraft-db.ts
import { testMinecraftDbConnection } from "./lib/prisma-minecraft";
import { validateMinecraftUsernameDb } from "./lib/luckperms";

async function test() {
  // Test connection
  const connection = await testMinecraftDbConnection();
  console.log("Connection test:", connection);

  // Test username validation
  const validation = await validateMinecraftUsernameDb("Notch");
  console.log("Username test:", validation);
}

test();
```

Run it:
```bash
ts-node test-minecraft-db.ts
```

Expected output:
```
Connection test: { success: true }
Username test: { valid: true, uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', primaryGroup: 'default' }
```

---

## Step 4: Update Staff Creation to Use Database Validation

Update `app/admin/staff/page.tsx` to use database validation:

```typescript
import { validateMinecraftUsernameDb } from "@/lib/luckperms";

export async function createStaffAction(formData: FormData) {
  // ... existing code ...

  // Validate Minecraft username via database
  if (minecraftName) {
    const validation = await validateMinecraftUsernameDb(minecraftName);
    
    if (!validation.valid) {
      return {
        success: false,
        message: `Minecraft username validation failed: ${validation.error}`,
      };
    }

    // Optional: Check if they have staff permissions on the server
    const perms = await getPlayerPermissionsDb(minecraftName);
    if (perms.success) {
      console.log(`[Staff] ${minecraftName} has groups:`, perms.groups);
    }
  }

  // ... continue with user creation ...
}
```

---

## Step 5: Available Database Functions

Once configured, you can use these functions:

### Validate Username
```typescript
import { validateMinecraftUsernameDb } from "@/lib/luckperms";

const result = await validateMinecraftUsernameDb("Steve");
// Returns: { valid: true, uuid: "...", primaryGroup: "default" }
```

### Get Player Permissions
```typescript
import { getPlayerPermissionsDb } from "@/lib/luckperms";

const result = await getPlayerPermissionsDb("Steve");
// Returns: {
//   success: true,
//   uuid: "...",
//   primaryGroup: "default",
//   groups: ["default", "vip"],
//   permissions: [
//     { permission: "some.perm", value: true, server: "global", world: "global" }
//   ]
// }
```

### Get Players in Group
```typescript
import { getPlayersInGroupDb } from "@/lib/luckperms";

const result = await getPlayersInGroupDb("admin");
// Returns: {
//   success: true,
//   players: [
//     { uuid: "...", username: "Admin1", primaryGroup: "admin" }
//   ]
// }
```

### Check Specific Permission
```typescript
import { playerHasPermissionDb } from "@/lib/luckperms";

const result = await playerHasPermissionDb("Steve", "staff.manage");
// Returns: { success: true, hasPermission: true }
```

### Get All Groups
```typescript
import { getAllGroupsDb } from "@/lib/luckperms";

const result = await getAllGroupsDb();
// Returns: {
//   success: true,
//   groups: [
//     { name: "admin", displayName: "Admin", weight: 100, playerCount: 5 }
//   ]
// }
```

### Search Players
```typescript
import { searchPlayersDb } from "@/lib/luckperms";

const result = await searchPlayersDb("ste");
// Returns: {
//   success: true,
//   players: [
//     { uuid: "...", username: "Steve", primaryGroup: "default" },
//     { uuid: "...", username: "SteveBot", primaryGroup: "bot" }
//   ]
// }
```

---

## Step 6: (Optional) Explore Database with Prisma Studio

View and edit your Minecraft database visually:

```bash
npm run prisma:minecraft:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all LuckPerms tables
- See player data and permissions
- Edit groups and permissions
- View audit logs

---

## LuckPerms Database Schema

### Tables

#### `luckperms_players`
Stores player UUIDs and usernames:
```sql
uuid          VARCHAR(36)   PRIMARY KEY
username      VARCHAR(16)
primary_group VARCHAR(36)
```

#### `luckperms_user_permissions`
User-specific permissions:
```sql
id         INT           PRIMARY KEY AUTO_INCREMENT
uuid       VARCHAR(36)   -- Player UUID
permission VARCHAR(200)  -- Permission node
value      BOOLEAN       -- True = granted, False = negated
server     VARCHAR(36)   -- Server scope (default: "global")
world      VARCHAR(36)   -- World scope (default: "global")
expiry     BIGINT        -- Unix timestamp (0 = permanent)
contexts   TEXT          -- JSON contexts
```

#### `luckperms_groups`
Group definitions:
```sql
name         VARCHAR(36)  PRIMARY KEY
display_name VARCHAR(36)
weight       INT          -- Priority (higher = more important)
```

#### `luckperms_group_permissions`
Group permissions (inherited by members):
```sql
id         INT           PRIMARY KEY AUTO_INCREMENT
name       VARCHAR(36)   -- Group name
permission VARCHAR(200)
value      BOOLEAN
server     VARCHAR(36)
world      VARCHAR(36)
expiry     BIGINT
contexts   TEXT
```

#### `luckperms_actions`
Audit log of all changes:
```sql
id          INT           PRIMARY KEY AUTO_INCREMENT
time        BIGINT        -- Unix timestamp
actor_uuid  VARCHAR(36)   -- Who performed the action
actor_name  VARCHAR(100)
type        CHAR(1)       -- 'U'=user, 'G'=group, 'T'=track
acted_uuid  VARCHAR(36)   -- Who was affected
acted_name  VARCHAR(36)
action      VARCHAR(300)  -- Description of action
```

---

## Troubleshooting

### Error: "Can't reach database server"
**Solution:**
1. Check your `MINECRAFT_DATABASE_URL` is correct
2. Verify the MySQL server is running
3. Check firewall allows connection on port 3306
4. Test connection with:
   ```bash
   mysql -h minecraft-server.com -u mc_user -p minecraft
   ```

### Error: "Table 'luckperms_players' doesn't exist"
**Solution:**
1. Your table prefix might be different
2. Set `LUCKPERMS_TABLE_PREFIX` in `.env`
3. Or update `prisma/minecraft.prisma` with correct table names

### Error: "Access denied for user"
**Solution:**
1. Grant database permissions:
   ```sql
   GRANT SELECT ON minecraft.* TO 'web_app_user'@'%';
   FLUSH PRIVILEGES;
   ```
2. Use read-only user for security:
   ```sql
   CREATE USER 'luckperms_readonly'@'%' IDENTIFIED BY 'password';
   GRANT SELECT ON minecraft.luckperms_* TO 'luckperms_readonly'@'%';
   ```

### Warning: "Username not found in database"
**Possible reasons:**
1. Player hasn't joined the server yet
2. LuckPerms hasn't logged them yet
3. Using offline-mode UUIDs (check LuckPerms config)
4. Table prefix mismatch

**Fallback:** The system will use Mojang API validation if database validation fails.

---

## Security Best Practices

### 1. Use Read-Only Database User
```sql
CREATE USER 'imaginears_web'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON minecraft.luckperms_* TO 'imaginears_web'@'%';
FLUSH PRIVILEGES;
```

### 2. Restrict Database Access by IP
```sql
CREATE USER 'imaginears_web'@'123.456.789.0' IDENTIFIED BY 'password';
GRANT SELECT ON minecraft.luckperms_* TO 'imaginears_web'@'123.456.789.0';
```

### 3. Use SSL Connection
```env
MINECRAFT_DATABASE_URL="mysql://user:pass@host:3306/minecraft?sslmode=require"
```

### 4. Connection Pooling
The Prisma client automatically manages connection pooling. Configure in `.env`:
```env
MINECRAFT_DATABASE_URL="mysql://user:pass@host:3306/minecraft?connection_limit=5"
```

### 5. Environment Variables
- Never commit `.env` to git
- Use different credentials for dev/prod
- Rotate passwords regularly

---

## Migration Path to REST API

When you're ready to switch from direct database access to the LuckPerms REST API:

### 1. Install LuckPerms REST API Extension
On your Minecraft server:
```bash
cd plugins
wget https://download.luckperms.net/extensions/rest-api/latest
# Restart server
```

### 2. Configure REST API
Edit `plugins/LuckPerms/config.yml`:
```yaml
rest-api:
  enabled: true
  port: 8080
  bind-address: 0.0.0.0
  api-key: "your-secret-api-key"
```

### 3. Update .env
```env
LUCKPERMS_API_URL="https://minecraft-server.com:8080"
LUCKPERMS_API_KEY="your-secret-api-key"
```

### 4. Switch Functions
Replace database functions with API functions:
```typescript
// Before (Database):
import { validateMinecraftUsernameDb } from "@/lib/luckperms";

// After (API):
import { validateMinecraftUsername } from "@/lib/luckperms";
```

All function signatures remain the same, making migration seamless!

---

## Advanced: Custom Queries

You can write custom Prisma queries for advanced use cases:

```typescript
import { minecraftPrisma } from "@/lib/prisma-minecraft";

// Get all admins who've been online in the last week
const recentAdmins = await minecraftPrisma.$queryRaw`
  SELECT p.uuid, p.username, p.primary_group
  FROM luckperms_players p
  WHERE p.primary_group = 'admin'
    AND EXISTS (
      SELECT 1 FROM player_data pd
      WHERE pd.uuid = p.uuid
        AND pd.last_login > UNIX_TIMESTAMP() - 604800
    )
`;

// Get permission inheritance tree
const getGroupInheritance = async (groupName: string) => {
  const perms = await minecraftPrisma.luckPermsGroupPermission.findMany({
    where: {
      name: groupName,
      permission: {
        startsWith: 'group.',
      },
      value: true,
    },
  });
  
  return perms.map(p => p.permission.replace('group.', ''));
};
```

---

## npm Scripts Reference

```bash
# Generate Minecraft Prisma client
npm run prisma:minecraft:generate

# Pull schema from database (sync with actual structure)
npm run prisma:minecraft:db:pull

# Push schema to database (careful - can modify DB!)
npm run prisma:minecraft:db:push

# Open Prisma Studio for Minecraft DB
npm run prisma:minecraft:studio

# Generate both Prisma clients (main app + Minecraft)
npm run prisma:generate:all
```

---

## Example: Staff Dashboard with LuckPerms Data

Create a staff dashboard showing Minecraft permissions:

```typescript
// app/admin/staff/[id]/minecraft/page.tsx
import { getPlayerPermissionsDb, getAllGroupsDb } from "@/lib/luckperms";

export default async function StaffMinecraftPage({ params }: { params: { id: string } }) {
  const staff = await prisma.user.findUnique({
    where: { id: params.id },
    select: { minecraftName: true },
  });

  if (!staff?.minecraftName) {
    return <div>No Minecraft username linked</div>;
  }

  const perms = await getPlayerPermissionsDb(staff.minecraftName);
  const allGroups = await getAllGroupsDb();

  return (
    <div>
      <h1>Minecraft Permissions for {staff.minecraftName}</h1>
      
      <section>
        <h2>Groups</h2>
        <ul>
          {perms.groups?.map(group => (
            <li key={group}>{group}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Permissions</h2>
        <ul>
          {perms.permissions?.map((perm, i) => (
            <li key={i}>
              {perm.value ? '✅' : '❌'} {perm.permission}
              {perm.server !== 'global' && ` (${perm.server})`}
              {perm.world !== 'global' && ` [${perm.world}]`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

---

## Next Steps

1. ✅ Set up `MINECRAFT_DATABASE_URL` in `.env`
2. ✅ Run `npm run prisma:minecraft:generate`
3. ✅ Test connection with `testMinecraftDbConnection()`
4. ✅ Update staff creation to use `validateMinecraftUsernameDb()`
5. ✅ Explore database with `npm run prisma:minecraft:studio`
6. 🔄 (Future) Set up LuckPerms REST API
7. 🔄 (Future) Migrate to API functions

---

## Support

- **LuckPerms Wiki:** https://luckperms.net/wiki
- **LuckPerms Discord:** https://discord.gg/luckperms
- **Prisma Docs:** https://www.prisma.io/docs

**Last Updated:** October 2025  
**Maintainer:** Development Team

