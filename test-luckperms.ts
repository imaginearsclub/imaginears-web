/**
 * LuckPerms Database Integration Test
 * 
 * Run: npx ts-node test-luckperms.ts
 */

import { testMinecraftDbConnection } from "./lib/prisma-minecraft";
import { 
  validateMinecraftUsernameDb, 
  getPlayerPermissionsDb,
  getAllGroupsDb,
  searchPlayersDb 
} from "./lib/luckperms";

async function runTests() {
  console.log("🔧 Testing LuckPerms Database Integration...\n");

  // Test 1: Database Connection
  console.log("1️⃣ Testing database connection...");
  const connectionTest = await testMinecraftDbConnection();
  if (connectionTest.success) {
    console.log("✅ Database connection successful!\n");
  } else {
    console.log("❌ Database connection failed:", connectionTest.error);
    console.log("💡 Make sure MINECRAFT_DATABASE_URL is set in .env\n");
    return;
  }

  // Test 2: Get All Groups
  console.log("2️⃣ Fetching all LuckPerms groups...");
  const groupsResult = await getAllGroupsDb();
  if (groupsResult.success && groupsResult.groups) {
    console.log(`✅ Found ${groupsResult.groups.length} groups:`);
    groupsResult.groups.forEach(group => {
      console.log(`   - ${group.name} (${group.playerCount} players, weight: ${group.weight})`);
    });
    console.log();
  } else {
    console.log("❌ Failed to fetch groups:", groupsResult.error, "\n");
  }

  // Test 3: Search for Players
  console.log("3️⃣ Searching for players...");
  const searchResult = await searchPlayersDb("er"); // Search for players with 'er' in name
  if (searchResult.success && searchResult.players) {
    console.log(`✅ Found ${searchResult.players.length} players (showing first 5):`);
    searchResult.players.slice(0, 5).forEach(player => {
      console.log(`   - ${player.username} (${player.primaryGroup})`);
    });
    console.log();

    // Test 4: Get Specific Player Permissions
    if (searchResult.players.length > 0) {
      const testPlayer = searchResult.players[0];
      console.log(`4️⃣ Getting permissions for ${testPlayer.username}...`);
      const permsResult = await getPlayerPermissionsDb(testPlayer.username);
      if (permsResult.success) {
        console.log(`✅ Player details:`);
        console.log(`   UUID: ${permsResult.uuid}`);
        console.log(`   Primary Group: ${permsResult.primaryGroup}`);
        console.log(`   All Groups: ${permsResult.groups?.join(", ")}`);
        console.log(`   Permissions: ${permsResult.permissions?.length || 0} total`);
        if (permsResult.permissions && permsResult.permissions.length > 0) {
          console.log(`   First 3 permissions:`);
          permsResult.permissions.slice(0, 3).forEach(perm => {
            console.log(`      ${perm.value ? '✓' : '✗'} ${perm.permission}`);
          });
        }
        console.log();
      } else {
        console.log("❌ Failed to get permissions:", permsResult.error, "\n");
      }
    }
  } else {
    console.log("❌ No players found or error:", searchResult.error);
    console.log("💡 Make sure players have joined your server at least once\n");
  }

  // Test 5: Validate Username (using your actual username if you want)
  console.log("5️⃣ Testing username validation...");
  console.log("Enter a Minecraft username to test (or press Enter to skip):");
  
  // For automated testing, try common usernames
  const testUsernames = ["Notch", "jeb_", "Dinnerbone"];
  for (const username of testUsernames) {
    const validation = await validateMinecraftUsernameDb(username);
    if (validation.valid) {
      console.log(`✅ ${username} found in database!`);
      console.log(`   UUID: ${validation.uuid}`);
      console.log(`   Group: ${validation.primaryGroup}`);
      break;
    }
  }
  console.log();

  // Summary
  console.log("🎉 Tests complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Test with your actual Minecraft username");
  console.log("   2. Update staff creation form to use validateMinecraftUsernameDb()");
  console.log("   3. Add staff dashboard showing MC permissions");
  
  process.exit(0);
}

runTests().catch(error => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});

