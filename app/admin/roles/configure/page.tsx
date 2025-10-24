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
import { RolesList } from "./components/RolesList";
import { CreateRoleForm } from "./components/CreateRoleForm";
import type { Permission } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server Actions
export async function createRoleAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const description = (formData.get("description") as string)?.trim();
  const color = (formData.get("color") as string)?.trim() || null;
  const permissionsJson = formData.get("permissions") as string;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  // Validate slug format (alphanumeric, hyphens, underscores)
  if (!/^[a-z0-9-_]+$/.test(slug)) {
    throw new Error("Slug can only contain lowercase letters, numbers, hyphens, and underscores");
  }

  // Parse permissions
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(permissionsJson || "[]");
  } catch {
    throw new Error("Invalid permissions format");
  }

  // Create custom role
  await prisma.customRole.create({
    data: {
      slug,
      name,
      description: description || null,
      permissions: JSON.stringify(permissions),
      color,
      isSystem: false,
    },
  });

  revalidatePath("/admin/roles/configure");
  return { success: true, message: "Role created successfully" };
}

export async function updateRoleAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const roleId = formData.get("roleId") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const color = (formData.get("color") as string)?.trim() || null;
  const permissionsJson = formData.get("permissions") as string;

  if (!roleId || !name) {
    throw new Error("Role ID and name are required");
  }

  // Check if role is system role
  const role = await prisma.customRole.findUnique({
    where: { id: roleId },
    select: { isSystem: true },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  // Parse permissions
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(permissionsJson || "[]");
  } catch {
    throw new Error("Invalid permissions format");
  }

  // Update role
  await prisma.customRole.update({
    where: { id: roleId },
    data: {
      name,
      description: description || null,
      permissions: JSON.stringify(permissions),
      color,
    },
  });

  revalidatePath("/admin/roles/configure");
  revalidatePath("/admin/roles");
  return { success: true, message: "Role updated successfully" };
}

export async function deleteRoleAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const roleId = formData.get("roleId") as string;

  if (!roleId) {
    throw new Error("Role ID is required");
  }

  // Check if role is system role
  const role = await prisma.customRole.findUnique({
    where: { id: roleId },
    select: { isSystem: true, slug: true },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  if (role.isSystem) {
    throw new Error("Cannot delete system roles");
  }

  // Check if any users have this role
  const usersWithRole = await prisma.user.count({
    where: { role: role.slug },
  });

  if (usersWithRole > 0) {
    throw new Error(`Cannot delete role: ${usersWithRole} user(s) still have this role`);
  }

  // Delete role
  await prisma.customRole.delete({
    where: { id: roleId },
  });

  revalidatePath("/admin/roles/configure");
  revalidatePath("/admin/roles");
  return { success: true, message: "Role deleted successfully" };
}

export default async function RoleConfigurePage() {
  // Require admin authentication
  const session = await requireAdmin();
  if (!session) {
    redirect("/login");
  }

  // Fetch all roles
  const roles = await prisma.customRole.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      permissions: true,
      isSystem: true,
      color: true,
      createdAt: true,
    },
    orderBy: [
      { isSystem: "desc" }, // System roles first
      { name: "asc" },
    ],
  });

  // Count users per role
  const userCounts: Record<string, number> = {};
  for (const role of roles) {
    const count = await prisma.user.count({
      where: { role: role.slug },
    });
    userCounts[role.slug] = count;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Configuration</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Create custom roles and configure permissions for all roles (system and custom).
        </p>
      </div>

      {/* Create Role Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Role</CardTitle>
          <CardDescription>
            Add a new role with custom permissions. System roles (OWNER, ADMIN, etc.) cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateRoleForm action={createRoleAction} />
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            Manage permissions for system and custom roles. System roles cannot be deleted but their permissions can be customized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesList
            roles={roles.map(role => ({
              ...role,
              permissions: JSON.parse(role.permissions as string) as Permission[],
              userCount: userCounts[role.slug] || 0,
            }))}
            updateAction={updateRoleAction}
            deleteAction={deleteRoleAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}

