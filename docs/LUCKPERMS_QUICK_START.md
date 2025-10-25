# LuckPerms Database Integration - Quick Start

## 🚀 What's Been Set Up

You now have direct database access to your Minecraft server's LuckPerms data! This allows you to validate staff Minecraft usernames in real-time and check player permissions.

---

## ⚡ Quick Setup (3 Steps)

### 1. Add Database URL to `.env`

```env
# Add this line to your .env file:
MINECRAFT_DATABASE_URL="mysql://username:password@your-minecraft-server.com:3306/minecraft"

# Optional: If you use a custom table prefix
LUCKPERMS_TABLE_PREFIX="luckperms_"
```

**Example URLs:**
```env
# Same server
MINECRAFT_DATABASE_URL="mysql://root:password@localhost:3306/minecraft"

# Remote server
MINECRAFT_DATABASE_URL="mysql://mcuser:pass123@123.456.789.0:3306/minecraft"

# With SSL
MINECRAFT_DATABASE_URL="mysql://user:pass@host:3306/minecraft?sslmode=require"
```

### 2. Generate Prisma Client

```bash
npm run prisma:minecraft:generate
```

This creates the TypeScript types for your LuckPerms tables.

### 3. Test Connection

Create a test file `test-luckperms.ts`:

```typescript
import { validateMinecraftUsernameDb } from "./lib/luckperms";

async function test() {
  const result = await validateMinecraftUsernameDb("Notch");
  console.log("Result:", result);
}

test();
```

Run it:
```bash
npx ts-node test-luckperms.ts
```

✅ If you see `{ valid: true, uuid: '...', primaryGroup: '...' }` - you're all set!

---

## 🎯 How to Use

### Validate Minecraft Username

```typescript
import { validateMinecraftUsernameDb } from "@/lib/luckperms";

const result = await validateMinecraftUsernameDb("Steve");

if (result.valid) {
  console.log("✅ Username found!");
  console.log("UUID:", result.uuid);
  console.log("Primary Group:", result.primaryGroup);
} else {
  console.log("❌ Error:", result.error);
}
```

### Get Player Permissions

```typescript
import { getPlayerPermissionsDb } from "@/lib/luckperms";

const perms = await getPlayerPermissionsDb("Steve");

if (perms.success) {
  console.log("Groups:", perms.groups);          // ["default", "vip"]
  console.log("Permissions:", perms.permissions); // [{ permission: "...", value: true }]
}
```

### Find All Admins

```typescript
import { getPlayersInGroupDb } from "@/lib/luckperms";

const admins = await getPlayersInGroupDb("admin");

if (admins.success) {
  admins.players?.forEach(player => {
    console.log(`${player.username} - ${player.uuid}`);
  });
}
```

### Check Specific Permission

```typescript
import { playerHasPermissionDb } from "@/lib/luckperms";

const hasPerm = await playerHasPermissionDb("Steve", "staff.manage");

if (hasPerm.success && hasPerm.hasPermission) {
  console.log("✅ Player has permission!");
}
```

---

## 🔧 Integration with Staff Creation

Update `app/admin/staff/page.tsx`:

```typescript
import { validateMinecraftUsernameDb } from "@/lib/luckperms";

export async function createStaffAction(formData: FormData) {
  const minecraftName = formData.get("minecraftName") as string;
  
  if (minecraftName) {
    // Validate via database
    const validation = await validateMinecraftUsernameDb(minecraftName);
    
    if (!validation.valid) {
      return {
        success: false,
        message: `Invalid Minecraft username: ${validation.error}`,
      };
    }
    
    console.log(`✅ Validated: ${minecraftName} (${validation.uuid})`);
  }
  
  // Continue with staff creation...
}
```

---

## 📦 Available Functions

All functions are in `lib/luckperms.ts`:

| Function | Purpose | Returns |
|----------|---------|---------|
| `validateMinecraftUsernameDb(username)` | Check if username exists | `{ valid, uuid, primaryGroup }` |
| `getPlayerPermissionsDb(username)` | Get all permissions/groups | `{ success, groups, permissions }` |
| `getPlayersInGroupDb(groupName)` | List all players in group | `{ success, players[] }` |
| `playerHasPermissionDb(username, perm)` | Check specific permission | `{ success, hasPermission }` |
| `getAllGroupsDb()` | Get all LuckPerms groups | `{ success, groups[] }` |
| `searchPlayersDb(query)` | Search players by name | `{ success, players[] }` |

---

## 🛠️ Useful Commands

```bash
# Generate Prisma client for Minecraft DB
npm run prisma:minecraft:generate

# Sync schema with actual database
npm run prisma:minecraft:db:pull

# Open database in visual editor
npm run prisma:minecraft:studio

# Generate both clients (main + Minecraft)
npm run prisma:generate:all
```

---

## 🐛 Common Issues

### "Can't reach database server"
- Check `MINECRAFT_DATABASE_URL` is correct
- Verify MySQL port is open (default: 3306)
- Test with: `mysql -h host -u user -p database`

### "Table doesn't exist"
- Your table prefix might be different
- Check `plugins/LuckPerms/config.yml` for `table-prefix`
- Set `LUCKPERMS_TABLE_PREFIX` in `.env`

### "Access denied"
- Grant permissions:
  ```sql
  GRANT SELECT ON minecraft.luckperms_* TO 'user'@'%';
  ```

### "Username not found"
- Player hasn't joined server yet
- Falls back to Mojang API validation (still works!)

---

## 🔐 Security Tip

Use a **read-only database user** for security:

```sql
CREATE USER 'imaginears_web'@'%' IDENTIFIED BY 'secure_password';
GRANT SELECT ON minecraft.luckperms_* TO 'imaginears_web'@'%';
FLUSH PRIVILEGES;
```

Then use this user in your `MINECRAFT_DATABASE_URL`.

---

## 📚 Full Documentation

See `docs/LUCKPERMS_SETUP.md` for:
- Detailed setup instructions
- Database schema reference
- Advanced queries
- Migration to REST API
- Troubleshooting guide
- Security best practices

---

## ✨ Next Steps

1. ✅ Add `MINECRAFT_DATABASE_URL` to `.env`
2. ✅ Run `npm run prisma:minecraft:generate`
3. ✅ Test connection
4. ✅ Update staff creation form
5. 🔜 (Optional) Set up LuckPerms REST API for write operations
6. 🔜 Create staff dashboard showing Minecraft permissions
7. 🔜 Auto-sync roles when staff is created

---

## 🎉 You're Done!

Your staff management system can now:
- ✅ Validate Minecraft usernames against your server
- ✅ Check player permissions and groups
- ✅ See who has staff permissions on server
- ✅ Link staff accounts to their Minecraft players
- ✅ Search and filter by Minecraft username

**Questions?** Check the full documentation in `docs/LUCKPERMS_SETUP.md`

---

**Created:** October 2025  
**Status:** ✅ Ready to use

