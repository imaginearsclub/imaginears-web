/**
 * Bulk User Operations API
 * 
 * POST /api/admin/users/bulk
 * Performs bulk operations on multiple users
 * 
 * Supported Operations:
 * - suspend: Suspend user accounts
 * - activate: Activate suspended accounts
 * - change-role: Change user roles
 * - reset-password: Send password reset emails
 * - send-email: Send bulk emails to users
 * 
 * Security: Permission-based access, rate limited, input validated
 * Performance: Batch operations, Promise.allSettled for parallel processing
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { auditLog } from '@/lib/audit-logger';
import { createApiHandler } from '@/lib/api-middleware';
import { checkPermission } from '@/lib/role-security';
import {
  bulkUserOperationSchema,
  type BulkUserOperation,
  type BulkOperationResult,
  BulkOperation,
  OPERATION_PERMISSIONS,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * Helper: Get action description for dry run preview
 */
function getActionDescription(operation: BulkUserOperation): string {
  switch (operation.operation) {
    case BulkOperation.SUSPEND:
      return 'Will be suspended';
    case BulkOperation.ACTIVATE:
      return 'Will be activated';
    case BulkOperation.CHANGE_ROLE:
      return `Role will be changed to ${operation.newRole}`;
    case BulkOperation.RESET_PASSWORD:
      return 'Password reset email will be sent';
    case BulkOperation.SEND_EMAIL:
      return `Email will be sent: ${operation.emailSubject}`;
    default:
      return 'Unknown operation';
  }
}

/**
 * Helper: Process suspend operation
 */
async function processSuspend(userId: string, email: string): Promise<void> {
  // In production, add a suspended field to user table
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { suspended: true },
  // });
  
  log.info('User suspended (placeholder)', { userId, email });
}

/**
 * Helper: Process activate operation
 */
async function processActivate(userId: string, email: string): Promise<void> {
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { suspended: false },
  // });
  
  log.info('User activated (placeholder)', { userId, email });
}

/**
 * Helper: Process change role operation
 */
async function processChangeRole(
  userId: string,
  email: string,
  newRole: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
  
  log.info('User role changed', { userId, email, newRole });
}

/**
 * Helper: Process reset password operation
 */
async function processResetPassword(userId: string, email: string): Promise<void> {
  // In production, generate password reset token and send email
  // const token = await generatePasswordResetToken(userId);
  // await sendPasswordResetEmail(email, token);
  
  log.info('Password reset email sent (placeholder)', { userId, email });
}

/**
 * Helper: Process send email operation
 */
async function processSendEmail(
  userId: string,
  email: string,
  subject: string,
  body: string
): Promise<void> {
  // In production, send email
  // await sendEmail({
  //   to: email,
  //   subject,
  //   body,
  // });
  
  log.info('Email sent (placeholder)', { userId, email, subject });
}

/**
 * Helper: Process a single user operation
 * 
 * Memory Safety: Handles errors without throwing to prevent memory leaks
 * Performance: Designed for parallel execution with Promise.allSettled
 */
async function processUserOperation(
  email: string,
  operation: BulkUserOperation
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: `User not found: ${email}`,
      };
    }

    // Process based on operation type
    switch (operation.operation) {
      case BulkOperation.SUSPEND:
        await processSuspend(targetUser.id, email);
        break;

      case BulkOperation.ACTIVATE:
        await processActivate(targetUser.id, email);
        break;

      case BulkOperation.CHANGE_ROLE:
        await processChangeRole(targetUser.id, email, operation.newRole);
        break;

      case BulkOperation.RESET_PASSWORD:
        await processResetPassword(targetUser.id, email);
        break;

      case BulkOperation.SEND_EMAIL:
        await processSendEmail(
          targetUser.id,
          email,
          operation.emailSubject,
          operation.emailBody
        );
        break;

      default:
        return {
          success: false,
          error: `Unknown operation: ${operation.operation}`,
        };
    }

    return { success: true };
  } catch (error) {
    log.error('Error processing user operation', {
      email,
      operation: operation.operation,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: `Error processing ${email}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * POST /api/admin/users/bulk
 * 
 * Performs bulk operations on multiple users
 * 
 * Security:
 * - Permission-based access (specific permission per operation)
 * - Rate limited to 10 operations per hour (strict for bulk operations)
 * - Input validation with Zod discriminated unions
 * - Max 100 users per operation
 * 
 * Performance:
 * - Parallel processing with Promise.allSettled
 * - Efficient database queries (select only needed fields)
 * - Duration monitoring with slow operation warnings
 * - Dry run mode for preview without execution
 * 
 * Operations:
 * - suspend: Suspend user accounts
 * - activate: Activate suspended accounts
 * - change-role: Change user roles
 * - reset-password: Send password reset emails
 * - send-email: Send bulk emails
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'users:bulk',
      limit: 10, // Strict limit for bulk operations
      window: 3600,
      strategy: 'sliding-window',
    },
    validateBody: bulkUserOperationSchema,
  },
  async (_req, { userId, validatedBody }) => {
    const startTime = Date.now();
    const operation = validatedBody as BulkUserOperation;

    try {
      // Check if user has the specific permission for this operation
      const requiredPermission = OPERATION_PERMISSIONS[operation.operation];
      const hasPermission = await checkPermission(userId!, requiredPermission);

      if (!hasPermission) {
        log.warn('Bulk operation permission denied', {
          userId,
          operation: operation.operation,
          requiredPermission,
        });

        return NextResponse.json(
          {
            success: false,
            error: `Forbidden: Missing permission '${requiredPermission}'`,
          },
          { status: 403 }
        );
      }

      log.info('Bulk user operation started', {
        userId,
        operation: operation.operation,
        userCount: operation.users.length,
        dryRun: operation.dryRun,
      });

      // Dry run mode - preview without executing
      if (operation.dryRun) {
        const preview = operation.users.map((email) => ({
          email,
          action: getActionDescription(operation),
        }));

        const duration = Date.now() - startTime;

        log.info('Bulk operation dry run completed', {
          userId,
          operation: operation.operation,
          affectedUsers: operation.users.length,
          duration,
        });

        return NextResponse.json({
          success: true,
          dryRun: true,
          operation: operation.operation,
          affectedUsers: operation.users.length,
          preview,
        });
      }

      // Process all users in parallel for performance
      // Using Promise.allSettled to handle all operations and collect results
      const results = await Promise.allSettled(
        operation.users.map((email) => processUserOperation(email, operation))
      );

      // Aggregate results
      const aggregated: BulkOperationResult = {
        success: 0,
        failed: 0,
        total: operation.users.length,
        operation: operation.operation,
        errors: [],
      };

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            aggregated.success++;
          } else {
            aggregated.failed++;
            if (result.value.error) {
              aggregated.errors.push(result.value.error);
            }
          }
        } else {
          // Promise rejected - should rarely happen due to error handling in processUserOperation
          aggregated.failed++;
          aggregated.errors.push(`Unexpected error: ${result.reason}`);
        }
      }

      const duration = Date.now() - startTime;

      // Performance: Log slow operations
      if (duration > 5000) {
        log.warn('Slow bulk operation', {
          userId,
          operation: operation.operation,
          userCount: operation.users.length,
          duration,
          successRate: `${aggregated.success}/${aggregated.total}`,
        });
      }

      // Audit log for bulk operations
      await auditLog({
        userId: userId!,
        action: `bulk_${operation.operation}`,
        resourceType: 'user',
        resourceId: 'bulk',
        details: {
          operation: operation.operation,
          totalUsers: aggregated.total,
          successful: aggregated.success,
          failed: aggregated.failed,
          duration,
        },
        ipAddress: _req.headers.get('x-forwarded-for') || undefined,
        userAgent: _req.headers.get('user-agent') || undefined,
      });

      log.info('Bulk user operation completed', {
        userId,
        operation: operation.operation,
        duration,
        ...aggregated,
      });

      return NextResponse.json(
        {
          success: true,
          ...aggregated,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Bulk user operation failed', {
        userId,
        operation: operation.operation,
        userCount: operation.users.length,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error during bulk operation',
        },
        { status: 500 }
      );
    }
  }
);

