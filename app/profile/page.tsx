import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/app/profile/components/UserAvatar";
import { ProfileContent } from "@/app/profile/components/ProfileContent";
import { getPlayerPermissionsDb } from "@/lib/luckperms";
import { enhanceExistingSession } from "@/lib/enhance-session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // Require authentication
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Enhance current session with tracking data (if not already enhanced)
  if (session?.session?.token) {
    await enhanceExistingSession(session.session.token);
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      minecraftName: true,
      timezone: true,
      role: true,
      image: true,
      emailVerified: true,
      twoFactorEnabled: true,
      createdAt: true,
      accounts: {
        select: {
          id: true,
          providerId: true,
          accountId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Fetch active sessions with enhanced data
  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      token: true,
      deviceName: true,
      deviceType: true,
      browser: true,
      os: true,
      country: true,
      city: true,
      trustLevel: true,
      isSuspicious: true,
      lastActivityAt: true,
      isRememberMe: true,
      loginMethod: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { lastActivityAt: "desc" }, // Changed to show most recently active first
  });

  // Fetch applications
  const applications = await prisma.application.findMany({
    where: { 
      email: user.email || "",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      mcUsername: true,
      role: true,
      ageRange: true,
      notes: true,
      updatedBy: {
        select: {
          name: true,
        },
      },
      priorServers: true,
      visitedDetails: true,
      devPortfolioUrl: true,
      imgPortfolioUrl: true,
      grStory: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch API keys (only for staff users)
  const isStaff = ["OWNER", "ADMIN", "MODERATOR", "STAFF"].includes(user.role);
  let apiKeys: any[] = [];
  
  if (isStaff) {
    try {
      // @ts-ignore - apiKey model might not exist yet before migration
      apiKeys = await prisma.apiKey?.findMany({
        where: { createdById: session.user.id },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          isActive: true,
          rateLimit: true,
          lastUsedAt: true,
          usageCount: true,
          description: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }) || [];
    } catch (error) {
      console.log("API Keys not yet available - migration needed");
      apiKeys = [];
    }
  }

  // Get Minecraft permissions and UUID if linked
  let minecraftPermissions = null;
  let minecraftUuid = null;
  if (user.minecraftName) {
    const permsResult = await getPlayerPermissionsDb(user.minecraftName);
    if (permsResult.success) {
      minecraftPermissions = permsResult;
      minecraftUuid = permsResult.uuid;
    }
  }

  return (
    <main className="container py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name || "Unknown User"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
              <UserAvatar 
                uuid={minecraftUuid ?? undefined}
                minecraftName={user.minecraftName}
                userName={user.name}
              />
            </div>
          </div>
        </div>

        {/* Profile Content with Sidebar */}
        <ProfileContent
          userData={{
            name: user.name || "",
            email: user.email || "",
            role: user.role,
            emailVerified: user.emailVerified ? (typeof user.emailVerified === 'boolean' ? user.emailVerified : true) : null,
            timezone: user.timezone,
            createdAt: user.createdAt,
            minecraftName: user.minecraftName,
            twoFactorEnabled: user.twoFactorEnabled || false,
          }}
          sessions={sessions}
          accounts={user.accounts}
          applications={applications}
          apiKeys={apiKeys}
          minecraftPermissions={minecraftPermissions}
          currentSessionToken={session?.session?.token}
        />
      </div>
    </main>
  );
}
