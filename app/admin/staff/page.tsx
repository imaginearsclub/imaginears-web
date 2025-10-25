import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StaffList } from "./components/StaffList";
import { CreateStaffForm } from "./components/CreateStaffForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common";
import { Users, UserPlus, Shield } from "lucide-react";
import { validateMinecraftUsernameDb } from "@/lib/luckperms";

export const dynamic = "force-dynamic";

// Server Action: Create new staff member
export async function createStaffAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const minecraftName = formData.get("minecraftName") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  // Validation
  if (!name || !email || !password || !role) {
    return { success: false, message: "Name, email, role, and password are required" };
  }

  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  // Validate Minecraft username format (3-16 alphanumeric + underscore)
  if (minecraftName) {
    const mcRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!mcRegex.test(minecraftName)) {
      return { success: false, message: "Invalid Minecraft username format (3-16 characters, alphanumeric and underscores only)" };
    }

    // Validate against LuckPerms database
    const mcValidation = await validateMinecraftUsernameDb(minecraftName);
    if (!mcValidation.valid) {
      return { 
        success: false, 
        message: `Minecraft username validation failed: ${mcValidation.error || 'Player not found in LuckPerms database'}` 
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

    // Import Better-Auth for password hashing
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

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

    revalidatePath("/admin/staff");
    return { 
      success: true, 
      message: `Staff member ${name} created successfully. They can now log in with their email and password.`,
      userId: user.id,
    };
  } catch (error: any) {
    console.error("[CreateStaff] Error:", error);
    return { success: false, message: error.message || "Failed to create staff member" };
  }
}

// Server Action: Update staff member
export async function updateStaffAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;
  const minecraftName = formData.get("minecraftName") as string;
  const role = formData.get("role") as string;

  if (!userId) {
    return { success: false, message: "User ID is required" };
  }

  // Validate Minecraft username format (if provided)
  if (minecraftName) {
    const mcRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!mcRegex.test(minecraftName)) {
      return { success: false, message: "Invalid Minecraft username format" };
    }

    // Validate against LuckPerms database
    const mcValidation = await validateMinecraftUsernameDb(minecraftName);
    if (!mcValidation.valid) {
      return { 
        success: false, 
        message: `Minecraft username validation failed: ${mcValidation.error || 'Player not found in LuckPerms database'}` 
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
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        minecraftName: minecraftName || null,
        ...(role && { role }),
      },
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff member updated successfully" };
  } catch (error: any) {
    console.error("[UpdateStaff] Error:", error);
    return { success: false, message: error.message || "Failed to update staff member" };
  }
}

// Server Action: Delete staff member
export async function deleteStaffAction(formData: FormData) {
  "use server";
  
  const session = await requireAdmin();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { success: false, message: "User ID is required" };
  }

  // Prevent deleting yourself
  if (userId === session.user?.id) {
    return { success: false, message: "You cannot delete your own account" };
  }

  // Prevent deleting the last owner
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (targetUser?.role === "OWNER") {
    const ownerCount = await prisma.user.count({
      where: { role: "OWNER" },
    });

    if (ownerCount <= 1) {
      return { success: false, message: "Cannot delete the last owner account" };
    }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/staff");
    return { success: true, message: "Staff member deleted successfully" };
  } catch (error: any) {
    console.error("[DeleteStaff] Error:", error);
    return { success: false, message: error.message || "Failed to delete staff member" };
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cast Member Management</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create and manage staff accounts with Minecraft username linking
            </p>
          </div>
        </div>
      </div>

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

