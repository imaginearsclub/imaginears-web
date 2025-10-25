import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/check-2fa
 * 
 * Checks if a user has 2FA enabled without creating a session
 * 
 * Request body:
 * - email: User's email
 * - password: User's password
 * 
 * Response:
 * - requires2FA: boolean
 * - message: string
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { requires2FA: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists - return generic error
      return NextResponse.json(
        { requires2FA: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
      select: { password: true },
    });

    if (!account?.password) {
      return NextResponse.json(
        { requires2FA: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(password, account.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { requires2FA: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Password is valid - check if 2FA is enabled
    return NextResponse.json({
      requires2FA: user.twoFactorEnabled || false,
      message: user.twoFactorEnabled 
        ? "2FA verification required" 
        : "Credentials verified",
    });
  } catch (error) {
    console.error("[Check2FA] Unexpected error:", error);
    return NextResponse.json(
      { requires2FA: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

