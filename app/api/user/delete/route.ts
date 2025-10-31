import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

/**
 * GDPR Account Deletion
 * Permanently deletes user account and all associated data
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, confirmText } = body;

    // Validate confirmation text
    if (confirmText !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Please type 'DELETE MY ACCOUNT' to confirm" },
        { status: 400 }
      );
    }

    // Verify password for security
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
      select: { password: true },
    });

    if (account?.password) {
      const isValidPassword = await verifyPassword(account.password, password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    } else if (password) {
      // User doesn't have a password (OAuth only) but provided one
      return NextResponse.json(
        { error: "This account uses social login only" },
        { status: 400 }
      );
    }

    // GDPR: Delete all user data
    // The cascade delete in Prisma schema will handle related records
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // Note: Sessions will be automatically deleted due to onDelete: Cascade in schema
    // Accounts will also be automatically deleted

    return NextResponse.json({
      success: true,
      message: "Account successfully deleted",
    });
  } catch (error) {
    console.error("[AccountDeletion] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

