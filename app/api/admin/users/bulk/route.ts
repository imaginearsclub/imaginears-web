import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, users, newRole, emailSubject, emailBody, dryRun } = body;

    if (!operation || !users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: "Invalid request. Required: operation, users (array)" },
        { status: 400 }
      );
    }

    // Check permission based on operation type
    let requiredPermission: string;
    switch (operation) {
      case "suspend":
        requiredPermission = "users:bulk_suspend";
        break;
      case "activate":
        requiredPermission = "users:bulk_activate";
        break;
      case "change-role":
        requiredPermission = "users:bulk_change_roles";
        break;
      case "reset-password":
        requiredPermission = "users:bulk_reset_passwords";
        break;
      case "send-email":
        requiredPermission = "users:bulk_send_email";
        break;
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    // Check if user has the specific permission for this operation
    const session = await requirePermission(requiredPermission as any);
    if (!session) {
      return NextResponse.json(
        { error: `Forbidden: Missing permission '${requiredPermission}'` },
        { status: 403 }
      );
    }

    // Dry run mode - just return what would happen
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        operation,
        affectedUsers: users.length,
        preview: users.map((email: string) => ({
          email,
          action: getActionDescription(operation, newRole, emailSubject),
        })),
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const email of users) {
      try {
        const targetUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!targetUser) {
          results.failed++;
          results.errors.push(`User not found: ${email}`);
          continue;
        }

        switch (operation) {
          case "suspend":
            // In production, add a suspended field to user table
            // await prisma.user.update({
            //   where: { id: targetUser.id },
            //   data: { suspended: true },
            // });
            results.success++;
            break;

          case "activate":
            // await prisma.user.update({
            //   where: { id: targetUser.id },
            //   data: { suspended: false },
            // });
            results.success++;
            break;

          case "change-role":
            if (!newRole) {
              results.failed++;
              results.errors.push(`No role specified for: ${email}`);
              continue;
            }
            await prisma.user.update({
              where: { id: targetUser.id },
              data: { role: newRole },
            });
            results.success++;
            break;

          case "reset-password":
            // In production, generate password reset token and send email
            // await sendPasswordResetEmail(targetUser.email);
            results.success++;
            break;

          case "send-email":
            if (!emailSubject || !emailBody) {
              results.failed++;
              results.errors.push(`Email subject/body missing for: ${email}`);
              continue;
            }
            // In production, send email
            // await sendEmail(targetUser.email, emailSubject, emailBody);
            results.success++;
            break;

          default:
            results.failed++;
            results.errors.push(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        console.error(`Error processing user ${email}:`, error);
        results.failed++;
        results.errors.push(`Error processing ${email}: ${error}`);
      }
    }

    return NextResponse.json({
      ...results,
      total: users.length,
      operation,
    });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getActionDescription(
  operation: string,
  newRole?: string,
  emailSubject?: string
): string {
  switch (operation) {
    case "suspend":
      return "Will be suspended";
    case "activate":
      return "Will be activated";
    case "change-role":
      return `Role will be changed to ${newRole}`;
    case "reset-password":
      return "Password reset email will be sent";
    case "send-email":
      return `Email will be sent: ${emailSubject}`;
    default:
      return "Unknown operation";
  }
}

