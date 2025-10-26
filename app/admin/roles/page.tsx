import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from "@/components/common";
import { UsersList } from "./components/UsersList";
import { getRoleDescription, getRoleLabel } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { Shield, Settings } from "lucide-react";

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

  // Role variant mapping for visual consistency
  const roleVariants = {
    OWNER: "danger",
    ADMIN: "warning",
    MODERATOR: "success",
    STAFF: "primary",
    USER: "default",
  } as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              User Roles & Permissions
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Manage user roles and configure custom permissions for fine-grained access control.
            </p>
          </div>
        </div>
        <Link href="/admin/roles/configure">
          <Button 
            variant="primary" 
            size="md"
            leftIcon={<Settings />}
            ariaLabel="Configure roles and permissions"
          >
            Configure Roles
          </Button>
        </Link>
      </div>

      {/* Role Overview */}
      <Card accent="purple" variant="elevated">
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>
            Overview of available roles and their capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const count = roleCountsMap[role] || 0;
              return (
                <div
                  key={role}
                  className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                        {getRoleLabel(role)}
                      </h3>
                    </div>
                    <Badge 
                      variant={roleVariants[role as keyof typeof roleVariants]}
                      size="sm"
                      ariaLabel={`${count} ${count === 1 ? "user" : "users"} with ${role} role`}
                    >
                      {count}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {getRoleDescription(role)}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card accent="primary" variant="elevated">
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

