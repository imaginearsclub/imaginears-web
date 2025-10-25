"use server";

import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { validateMinecraftUsernameDb } from "@/lib/luckperms";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
} from "@/lib/two-factor";

// Server Action: Update profile information
export async function updateProfileAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // Validation
  if (!name || !email) {
    return { success: false, message: "Name and email are required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  try {
    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return { success: false, message: "This email is already in use" };
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
      },
    });

    revalidatePath("/profile");
    return { success: true, message: "Profile updated successfully" };
  } catch (error: any) {
    console.error("[UpdateProfile] Error:", error);
    return { success: false, message: error.message || "Failed to update profile" };
  }
}

// Server Action: Update timezone preference
export async function updateTimezoneAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const timezone = formData.get("timezone") as string;

  // Validation
  if (!timezone) {
    return { success: false, message: "Timezone is required" };
  }

  // Validate timezone is a valid IANA timezone
  try {
    // Test if timezone is valid by trying to format a date with it
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch (error) {
    return { success: false, message: "Invalid timezone selected" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        timezone,
      },
    });

    revalidatePath("/profile");
    return { success: true, message: "Timezone preference updated successfully" };
  } catch (error: any) {
    console.error("[UpdateTimezone] Error:", error);
    return { success: false, message: error.message || "Failed to update timezone" };
  }
}

// Server Action: Update Minecraft username
export async function updateMinecraftAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const minecraftName = formData.get("minecraftName") as string;

  // Validate Minecraft username format
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

    // Check if Minecraft name is already taken by another user
    const existingMC = await prisma.user.findFirst({
      where: { 
        minecraftName,
        NOT: { 
          id: session.user.id,
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
      where: { id: session.user.id },
      data: {
        minecraftName: minecraftName || null,
      },
    });

    revalidatePath("/profile");
    
    // Return with uuid only if minecraftName is provided
    if (minecraftName) {
      const validation = await validateMinecraftUsernameDb(minecraftName);
      return {
        success: true,
        message: "Minecraft account linked successfully",
        ...(validation.uuid && { uuid: validation.uuid }),
      };
    } else {
      return {
        success: true,
        message: "Minecraft account unlinked successfully",
      };
    }
  } catch (error: any) {
    console.error("[UpdateMinecraft] Error:", error);
    return { success: false, message: error.message || "Failed to update Minecraft username" };
  }
}

// Server Action: Change password
export async function changePasswordAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: "All fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: "New passwords do not match" };
  }

  if (newPassword.length < 8) {
    return { success: false, message: "New password must be at least 8 characters" };
  }

  try {
    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Get the account to verify current password
    const account = await prisma.account.findFirst({
      where: { 
        userId: session.user.id,
        providerId: "credential",
      },
      select: { password: true },
    });

    if (!account?.password) {
      return { success: false, message: "Password authentication not available for this account" };
    }

    // Verify current password
    const bcrypt = require("bcryptjs");
    const isValid = await bcrypt.compare(currentPassword, account.password);

    if (!isValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.account.updateMany({
      where: { 
        userId: session.user.id,
        providerId: "credential",
      },
      data: {
        password: hashedPassword,
      },
    });

    revalidatePath("/profile");
    return { success: true, message: "Password changed successfully" };
  } catch (error: any) {
    console.error("[ChangePassword] Error:", error);
    return { success: false, message: error.message || "Failed to change password" };
  }
}

// Server Action: Delete session
export async function deleteSessionAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const sessionId = formData.get("sessionId") as string;

  if (!sessionId) {
    return { success: false, message: "Session ID is required" };
  }

  try {
    // Verify the session belongs to the user
    const sessionToDelete = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!sessionToDelete || sessionToDelete.userId !== session.user.id) {
      return { success: false, message: "Unauthorized to delete this session" };
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/profile");
    return { success: true, message: "Session deleted successfully" };
  } catch (error: any) {
    console.error("[DeleteSession] Error:", error);
    return { success: false, message: error.message || "Failed to delete session" };
  }
}

// Server Action: Enable 2FA (generate secret and QR code)
export async function enable2FAAction(_formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user || !user.email) {
      return { success: false, message: "User email not found" };
    }

    if (user.twoFactorEnabled) {
      return { success: false, message: "Two-factor authentication is already enabled" };
    }

    // Generate TOTP secret
    const secret = generateTOTPSecret();
    
    // Generate QR code
    const qrCode = await generateQRCode(user.email, secret);

    // Store the secret temporarily in session or return it
    // We'll encrypt it after verification
    return {
      success: true,
      message: "Scan the QR code with your authenticator app",
      qrCode,
      secret,
    };
  } catch (error: any) {
    console.error("[Enable2FA] Error:", error);
    return { success: false, message: error.message || "Failed to initialize 2FA setup" };
  }
}

// Server Action: Verify and complete 2FA setup
export async function verify2FASetupAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const verificationCode = formData.get("verificationCode") as string;

  if (!verificationCode || verificationCode.length !== 6) {
    return { success: false, message: "Please enter a valid 6-digit code" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });

    if (user?.twoFactorEnabled) {
      return { success: false, message: "Two-factor authentication is already enabled" };
    }

    // For verification, we need to get the secret from somewhere
    // Since we can't store it in the client, we'll need to pass it back through the form
    // or use a temporary storage. For now, let's get it from a hidden field
    const secret = formData.get("secret") as string;
    
    if (!secret) {
      return { success: false, message: "Setup session expired. Please start over." };
    }

    // Verify the code
    const isValid = verifyTOTPToken(verificationCode, secret);

    if (!isValid) {
      return { success: false, message: "Invalid verification code. Please try again." };
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

    // Encrypt the secret for storage
    const encryptedSecret = encryptSecret(secret);

    // Save to database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        backupCodes: hashedBackupCodes,
      },
    });

    revalidatePath("/profile");
    return {
      success: true,
      message: "Two-factor authentication enabled successfully!",
      backupCodes,
    };
  } catch (error: any) {
    console.error("[Verify2FASetup] Error:", error);
    return { success: false, message: error.message || "Failed to enable 2FA" };
  }
}

// Server Action: Disable 2FA
export async function disable2FAAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const password = formData.get("password") as string;
  const code = formData.get("code") as string;

  if (!password || !code) {
    return { success: false, message: "Password and 2FA code are required" };
  }

  try {
    // Get user and verify password
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
      select: { password: true },
    });

    if (!account?.password) {
      return { success: false, message: "Password authentication not available" };
    }

    const bcrypt = require("bcryptjs");
    const isValidPassword = await bcrypt.compare(password, account.password);

    if (!isValidPassword) {
      return { success: false, message: "Incorrect password" };
    }

    // Get user's 2FA secret and verify code
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      return { success: false, message: "Two-factor authentication is not enabled" };
    }

    // Decrypt secret and verify code
    const decryptedSecret = decryptSecret(user.twoFactorSecret);
    const isValidCode = verifyTOTPToken(code, decryptedSecret);

    // If TOTP fails, try backup codes
    if (!isValidCode) {
      const backupCodesArray = user.backupCodes as string[];
      const backupResult = verifyBackupCode(code, backupCodesArray || []);
      
      if (!backupResult.valid) {
        return { success: false, message: "Invalid 2FA code" };
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: Prisma.JsonNull,
      },
    });

    revalidatePath("/profile");
    return { success: true, message: "Two-factor authentication disabled successfully" };
  } catch (error: any) {
    console.error("[Disable2FA] Error:", error);
    return { success: false, message: error.message || "Failed to disable 2FA" };
  }
}

// Server Action: Link Discord account
export async function linkDiscordAction(_formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if Discord is already linked
    const existingDiscord = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "discord",
      },
    });

    if (existingDiscord) {
      return { success: false, message: "Discord account is already linked" };
    }

    // Generate OAuth URL for Discord linking
    const baseURL = process.env['NEXT_PUBLIC_SITE_URL'] || "http://localhost:3000";
    const discordURL = `${baseURL}/api/auth/sign-in/discord?mode=link`;

    return {
      success: true,
      message: "Redirecting to Discord...",
      url: discordURL,
    };
  } catch (error: any) {
    console.error("[LinkDiscord] Error:", error);
    return { success: false, message: error.message || "Failed to initiate Discord linking" };
  }
}

// Server Action: Unlink account
export async function unlinkAccountAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const providerId = formData.get("providerId") as string;

  if (!providerId) {
    return { success: false, message: "Provider ID is required" };
  }

  try {
    // Check if user has other auth methods
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { providerId: true },
    });

    if (accounts.length <= 1) {
      return { 
        success: false, 
        message: "Cannot unlink your only authentication method. Add another login method first." 
      };
    }

    // Find the account to unlink
    const accountToUnlink = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId,
      },
    });

    if (!accountToUnlink) {
      return { success: false, message: "Account not found" };
    }

    // Delete the account link
    await prisma.account.delete({
      where: { id: accountToUnlink.id },
    });

    revalidatePath("/profile");
    return { 
      success: true, 
      message: `Successfully unlinked ${providerId === "discord" ? "Discord" : providerId} account` 
    };
  } catch (error: any) {
    console.error("[UnlinkAccount] Error:", error);
    return { success: false, message: error.message || "Failed to unlink account" };
  }
}

