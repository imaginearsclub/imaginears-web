import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTOTPToken, verifyBackupCode, decryptSecret } from "@/lib/two-factor";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify-2fa
 * 
 * Verifies 2FA code and creates session if valid
 * 
 * Request body:
 * - email: User's email
 * - password: User's password
 * - code: 2FA code or backup code
 * 
 * Response:
 * - success: boolean
 * - requireSession: boolean (true if session was created)
 * - callbackUrl: string (where to redirect)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, code } = body;

    if (!email || !password || !code) {
      return NextResponse.json(
        { success: false, message: "Email, password, and code are required" },
        { status: 400 }
      );
    }

    // First, verify the user exists and has the correct password
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password with Better-Auth account
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
      },
      select: { password: true },
    });

    if (!account?.password) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(password, account.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: "2FA is not enabled for this account" },
        { status: 400 }
      );
    }

    // Verify the 2FA code
    let isValidCode = false;
    let shouldUpdateBackupCodes = false;
    let remainingBackupCodes: string[] | undefined;

    try {
      // First try TOTP
      const decryptedSecret = decryptSecret(user.twoFactorSecret);
      isValidCode = verifyTOTPToken(code, decryptedSecret);

      // If TOTP fails, try backup codes
      if (!isValidCode && user.backupCodes) {
        const backupCodesArray = user.backupCodes as string[];
        const backupResult = verifyBackupCode(code, backupCodesArray);

        if (backupResult.valid) {
          isValidCode = true;
          shouldUpdateBackupCodes = true;
          remainingBackupCodes = backupResult.remainingCodes;
        }
      }
    } catch (error) {
      console.error("[Verify2FA] Error verifying code:", error);
      return NextResponse.json(
        { success: false, message: "Failed to verify 2FA code" },
        { status: 500 }
      );
    }

    if (!isValidCode) {
      return NextResponse.json(
        { success: false, message: "Invalid 2FA code" },
        { status: 401 }
      );
    }

    // Update backup codes if one was used
    if (shouldUpdateBackupCodes && remainingBackupCodes !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { backupCodes: remainingBackupCodes },
      });
    }

    // Create a session using Better-Auth
    // We need to call Better-Auth's session creation
    try {
      const h = await headers();
      const origin = h.get("origin") || process.env['NEXT_PUBLIC_SITE_URL'] || "http://localhost:3000";
      
      // Sign in through Better-Auth to create the session
      const signInResponse = await fetch(`${origin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!signInResponse.ok) {
        throw new Error("Failed to create session");
      }

      // Get the cookies from Better-Auth response
      const setCookieHeaders = signInResponse.headers.getSetCookie();
      
      // Return success with the cookies
      const response = NextResponse.json({
        success: true,
        message: "2FA verification successful",
      });

      // Forward the session cookies
      for (const cookie of setCookieHeaders) {
        response.headers.append("Set-Cookie", cookie);
      }

      return response;
    } catch (error) {
      console.error("[Verify2FA] Error creating session:", error);
      return NextResponse.json(
        { success: false, message: "Failed to create session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Verify2FA] Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

