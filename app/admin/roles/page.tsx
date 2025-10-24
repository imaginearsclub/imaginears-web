import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/common";
import { UsersList } from "./components/UsersList";
import { getRoleDescription, getRoleLabel } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server Actions
export async function updateUserRoleAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;
  const newRole = formData.get("role") as UserRole;

  if (!userId || !newRole) {
    throw new Error("User ID and role are required");
  }

  // Prevent users from changing their own role if they're the only OWNER
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user?.id },
    select: { id: true, role: true },
  });

  if (currentUser?.id === userId && (currentUser as any).role === "OWNER") {
    const ownerCount = await prisma.user.count({
      where: { role: "OWNER" as any },
    });

    if (ownerCount <= 1) {
      throw new Error("Cannot change role: You are the only owner");
    }
  }

  // Update the user's role
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole } as any,
  });

  revalidatePath("/admin/roles");
  return { success: true, message: "User role updated successfully" };
}

export async function updateUserPermissionsAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;
  const permissionsJson = formData.get("permissions") as string;

  if (!userId) {
    throw new Error("User ID is required");
  }

  let permissions: Record<string, boolean> | null = null;
  
  if (permissionsJson) {
    try {
      permissions = JSON.parse(permissionsJson);
    } catch {
      throw new Error("Invalid permissions format");
    }
  }

  // Update the user's custom permissions
  await prisma.user.update({
    where: { id: userId },
    data: { permissions: permissions ? JSON.stringify(permissions) : null } as any,
  });

  revalidatePath("/admin/roles");
  return { success: true, message: "User permissions updated successfully" };
}

export default async function RolesPage() {
  // Require admin authentication
  const session = await requireAdmin();
  if (!session) {
    redirect("/login");
  }

  // Fetch all users with their roles
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      minecraftName: true,
      role: true,
      permissions: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          sessions: true,
        },
      },
    } as any,
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });

  // Get count of users per role
  const roleCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const roleCountsMap = Object.fromEntries(
    roleCounts.map((rc) => [rc.role, rc._count])
  );

  const roles = ["OWNER", "ADMIN", "MODERATOR", "STAFF", "USER"] as const;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Roles & Permissions</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage user roles and configure custom permissions for fine-grained access control.
          </p>
        </div>
        <a
          href="/admin/roles/configure"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Configure Roles
        </a>
      </div>

      {/* Role Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>
            Overview of available roles and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role}
                className="p-4 rounded-lg border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{getRoleLabel(role)}</h3>
                  <span className="text-sm font-medium text-slate-500">
                    {roleCountsMap[role] || 0} {roleCountsMap[role] === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getRoleDescription(role)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user roles and custom permissions. Click on a user to edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersList
            users={users as any}
            currentUserId={session.user?.id || ""}
            updateRoleAction={updateUserRoleAction}
            updatePermissionsAction={updateUserPermissionsAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}

