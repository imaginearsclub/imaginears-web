import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StaffList } from "./components/StaffList";
import { CreateStaffForm } from "./components/CreateStaffForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common";
import { PageHeader } from "@/components/admin/PageHeader";
import { Users, UserPlus, Shield } from "lucide-react";
import { validateMinecraftUsernameDb } from "@/lib/luckperms";
import {
  sanitizeInput,
  normalizeEmail,
  sanitizeMinecraftName,
} from "@/lib/input-sanitization";
import {
  validateLength,
  validateEmail,
  validateMinecraftName,
  validatePassword,
  MAX_LENGTHS,
  MIN_LENGTHS,
} from "@/lib/input-validation";
import {
  canAssignRole,
  isValidSystemRole,
  validateRoleChange,
} from "@/lib/role-security";
import {
  logUserCreated,
  logOperationFailed,
} from "@/lib/audit-logger";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

// Server Action: Create new staff member
export async function createStaffAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Extract and sanitize inputs
  const rawName = formData.get("name") as string;
  const rawEmail = formData.get("email") as string;
  const rawMinecraftName = formData.get("minecraftName") as string;
  const rawRole = formData.get("role") as string;
  const rawPassword = formData.get("password") as string;

  const name = sanitizeInput(rawName, MAX_LENGTHS.NAME);
  const email = normalizeEmail(rawEmail);
  const minecraftName = rawMinecraftName ? sanitizeMinecraftName(rawMinecraftName) : "";
  const role = rawRole?.trim();
  const password = rawPassword;

  // Comprehensive validation
  const nameValidation = validateLength(name, "Name", MIN_LENGTHS.NAME, MAX_LENGTHS.NAME);
  if (!nameValidation.valid) {
    return { success: false, message: nameValidation.error };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return { success: false, message: emailValidation.error };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.error };
  }

  // Validate role exists and user can assign it
  if (!role || !isValidSystemRole(role)) {
    return { success: false, message: "Invalid role selected" };
  }

  if (!canAssignRole(session.user.role, role)) {
    logOperationFailed(
      "user.created",
      session.user.id,
      session.user.email,
      `Attempted to assign unauthorized role: ${role}`
    );
    return { 
      success: false, 
      message: `You don't have permission to assign the ${role} role.` 
    };
  }

  // Validate Minecraft username if provided
  if (minecraftName) {
    const mcValidation = validateMinecraftName(minecraftName);
    if (!mcValidation.valid) {
      return { success: false, message: mcValidation.error };
    }

    // Validate against LuckPerms database
    const mcDbValidation = await validateMinecraftUsernameDb(minecraftName);
    if (!mcDbValidation.valid) {
      return { 
        success: false, 
        message: `Minecraft username validation failed: ${mcDbValidation.error || 'Player not found in LuckPerms database'}` 
      };
    }
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: "A user with this email already exists" };
    }

    // Check if Minecraft name is already taken (if provided)
    if (minecraftName) {
      const existingMC = await prisma.user.findFirst({
        where: { 
          minecraftName,
          NOT: { minecraftName: null }
        },
      });

      if (existingMC) {
        return { success: false, message: "This Minecraft username is already linked to another account" };
      }
    }

    // Hash password with Argon2id (OWASP 2023 recommendation)
    const hashedPassword = await hashPassword(password);

    // Create user and account in a transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        minecraftName: minecraftName || null,
        role,
        emailVerified: false, // They'll need to verify
        accounts: {
          create: {
            providerId: "credential",
            accountId: email,
            password: hashedPassword,
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    // Audit log
    logUserCreated(
      session.user.id,
      session.user.email,
      session.user.role,
      user.id,
      user.email!,
      user.role
    );

    revalidatePath("/admin/staff");
    return { 
      success: true, 
      message: `Staff member ${name} created successfully. They can now log in with their email and password.`,
      userId: user.id,
    };
  } catch (error: any) {
    console.error("[CreateStaff] Error:", error);
    logOperationFailed(
      "user.created",
      session.user.id,
      session.user.email,
      "Database error during user creation"
    );
    return { success: false, message: "Failed to create staff member. Please try again." };
  }
}

// Server Action: Update staff member
export async function updateStaffAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Extract and sanitize inputs
  const userId = formData.get("userId") as string;
  const rawMinecraftName = formData.get("minecraftName") as string;
  const rawRole = formData.get("role") as string;

  const minecraftName = rawMinecraftName ? sanitizeMinecraftName(rawMinecraftName) : "";
  const role = rawRole?.trim();

  if (!userId) {
    return { success: false, message: "User ID is required" };
  }

  try {
    // Get target user's current details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    // Build update data
    const updateData: any = {};
    const changes: Record<string, unknown> = {};

    // Validate and update Minecraft username if provided
    if (minecraftName) {
      const mcValidation = validateMinecraftName(minecraftName);
      if (!mcValidation.valid) {
        return { success: false, message: mcValidation.error };
      }

      // Validate against LuckPerms database
      const mcDbValidation = await validateMinecraftUsernameDb(minecraftName);
      if (!mcDbValidation.valid) {
        return { 
          success: false, 
          message: `Minecraft username validation failed: ${mcDbValidation.error || 'Player not found in LuckPerms database'}` 
        };
      }

      // Check if Minecraft name is already taken by someone else
      const existingMC = await prisma.user.findFirst({
        where: { 
          minecraftName,
          NOT: { 
            id: userId,
            minecraftName: null 
          }
        },
      });

      if (existingMC) {
        return { success: false, message: "This Minecraft username is already linked to another account" };
      }

      updateData["minecraftName"] = minecraftName;
      changes["minecraftName"] = minecraftName;
    }

    // Validate and update role if provided
    if (role) {
      const roleValidation = validateRoleChange(
        session.user.role,
        targetUser.role,
        role,
        session.user.id,
        userId
      );

      if (!roleValidation.valid) {
        logOperationFailed(
          "role.assigned",
          session.user.id,
          session.user.email,
          roleValidation.error || "Role validation failed"
        );
        return { success: false, message: roleValidation.error };
      }

      updateData["role"] = role;
      changes["role"] = { from: targetUser.role, to: role };
    }

    // Perform update
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Audit log
    const { logUserUpdated, logRoleAssigned } = await import("@/lib/audit-logger");
    logUserUpdated(
      session.user.id,
      session.user.email,
      targetUser.id,
      targetUser.email!,
      changes
    );

    if (role && role !== targetUser.role) {
      logRoleAssigned(
        session.user.id,
        session.user.email,
        targetUser.id,
        targetUser.email!,
        targetUser.role,
        role
      );
    }

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff member updated successfully" };
  } catch (error: any) {
    console.error("[UpdateStaff] Error:", error);
    logOperationFailed(
      "user.updated",
      session.user.id,
      session.user.email,
      "Database error during user update"
    );
    return { success: false, message: "Failed to update staff member. Please try again." };
  }
}

// Server Action: Delete staff member
export async function deleteStaffAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { success: false, message: "User ID is required" };
  }

  try {
    // Get target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    // Validate deletion permission
    const { validateUserDeletion } = await import("@/lib/role-security");
    const deletionValidation = validateUserDeletion(
      session.user.role,
      targetUser.role,
      session.user.id,
      userId
    );

    if (!deletionValidation.valid) {
      logOperationFailed(
        "user.deleted",
        session.user.id,
        session.user.email,
        deletionValidation.error || "Deletion validation failed"
      );
      return { success: false, message: deletionValidation.error };
    }

    // Extra safety: Prevent deleting the last owner
    if (targetUser.role === "OWNER") {
      const ownerCount = await prisma.user.count({
        where: { role: "OWNER" },
      });

      if (ownerCount <= 1) {
        return { success: false, message: "Cannot delete the last owner account" };
      }
    }

    // Perform deletion
    await prisma.user.delete({
      where: { id: userId },
    });

    // Audit log
    const { logUserDeleted } = await import("@/lib/audit-logger");
    logUserDeleted(
      session.user.id,
      session.user.email,
      targetUser.id,
      targetUser.email!,
      targetUser.role
    );

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff member deleted successfully" };
  } catch (error: any) {
    console.error("[DeleteStaff] Error:", error);
    logOperationFailed(
      "user.deleted",
      session.user.id,
      session.user.email,
      "Database error during user deletion"
    );
    return { success: false, message: "Failed to delete staff member. Please try again." };
  }
}

export default async function StaffManagementPage() {
  // Require admin authentication
  const session = await requireAdmin();
  if (!session) {
    redirect("/login");
  }

  // Fetch all staff users (exclude regular guests)
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ["OWNER", "ADMIN", "MODERATOR", "STAFF"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      minecraftName: true,
      role: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          sessions: true,
          createdEvents: true,
          createdApplications: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  });

  // Get stats
  const stats = {
    total: staff.length,
    withMinecraft: staff.filter(s => s.minecraftName).length,
    verified: staff.filter(s => s.emailVerified).length,
    active: staff.filter(s => s._count.sessions > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Cast Member Management"
        description="Create and manage staff accounts with Minecraft username linking"
        icon={<Shield className="w-6 h-6" />}
        badge={{ label: `${stats.total} Staff Members`, variant: "purple" }}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Staff" }
        ]}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked to MC</CardTitle>
            <UserPlus className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withMinecraft}</div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((stats.withMinecraft / stats.total) * 100)}% of staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Verified</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((stats.verified / stats.total) * 100)}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-slate-500 mt-1">Currently logged in</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Staff Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Cast Member</CardTitle>
          <CardDescription>
            Create a new staff account with optional Minecraft username linking. The staff member will receive their login credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateStaffForm action={createStaffAction} />
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>All Cast Members</CardTitle>
          <CardDescription>
            Manage existing staff accounts and their Minecraft username links. Click on a user to edit their details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffList 
            staff={staff} 
            currentUserId={session.user?.id || ""}
            updateAction={updateStaffAction}
            deleteAction={deleteStaffAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}

