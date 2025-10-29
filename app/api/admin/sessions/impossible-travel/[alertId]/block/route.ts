/**
 * Impossible Travel Block API
 * 
 * POST /api/admin/sessions/impossible-travel/[alertId]/block
 * Blocks a session flagged for impossible travel
 * 
 * Security: Requires sessions:revoke_any permission, rate limited
 * Performance: Single transaction, async email
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { sendEmail } from '@/lib/integrations/email';
import { revokeSession } from '@/lib/session-manager';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function sendSecurityAlert(
  userEmail: string,
  userName: string | null,
  ipAddress: string | null
) {
  try {
    await sendEmail({
      to: userEmail,
      subject: '🔒 Security Alert: Session Terminated',
      text: `
Security Alert

Hello ${userName || 'there'},

We detected suspicious activity on your account and have automatically terminated a session for your security.

Details:
- IP Address: ${ipAddress || 'Unknown'}
- Time: ${new Date().toLocaleString()}
- Reason: Impossible travel detection

If this was you, please log in again. If you did not authorize this activity, please change your password immediately.

What should you do?
1. Log in to your account
2. Review your recent activity
3. Change your password if needed
4. Enable two-factor authentication if not already enabled

If you have any concerns, please contact our support team.

Stay secure,
The Security Team
      `.trim(),
      html: `
        <h2>Security Alert</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>We detected suspicious activity on your account and have automatically terminated a session for your security.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>IP Address: ${ipAddress || 'Unknown'}</li>
          <li>Time: ${new Date().toLocaleString()}</li>
          <li>Reason: Impossible travel detection</li>
        </ul>
        <p>If this was you, please log in again. If you did not authorize this activity, please change your password immediately.</p>
        <p><strong>What should you do?</strong></p>
        <ol>
          <li>Log in to your account</li>
          <li>Review your recent activity</li>
          <li>Change your password if needed</li>
          <li>Enable two-factor authentication if not already enabled</li>
        </ol>
        <p>If you have any concerns, please contact our support team.</p>
        <p>Stay secure,<br>The Security Team</p>
      `,
    });
  } catch (error) {
    log.error('Impossible Travel: Failed to send security notification email', { error });
    // Don't throw - email failure shouldn't fail the request
  }
}

/**
 * POST /api/admin/sessions/impossible-travel/[alertId]/block
 * 
 * Blocks a session and notifies the user
 * 
 * Security: sessions:revoke_any permission check, rate limited
 * Performance: Async email notification
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:impossible-travel:block',
      limit: 30, // Max 30 blocks per minute
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId, params }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true },
      });

      if (!user) {
        log.warn('Impossible travel block - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check sessions:revoke_any permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'sessions:revoke_any'
      );

      if (!hasPermission) {
        log.warn('Impossible travel block - insufficient permissions', { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      const alertId = params!['alertId']!;
    
    // Extract session ID from alert ID (format: "alert-{sessionId}")
    const sessionId = alertId.replace('alert-', '');

    // Get the session details before revoking
    const targetSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Revoke the suspicious session using proper session manager
    // This will handle session activity logging automatically
    const revokeResult = await revokeSession(sessionId);
    
    if (!revokeResult.success) {
      log.error('Impossible Travel: Failed to revoke session', {
        error: revokeResult.error,
        sessionId,
      });
      return NextResponse.json(
        { error: 'Failed to revoke session' },
        { status: 500 }
      );
    }

      const duration = Date.now() - startTime;

      // Security: Audit log the block action
      log.warn('Impossible travel session blocked', {
        alertId,
        sessionId,
        targetUserId: targetSession.userId,
        blockedBy: userId,
        blockedByEmail: user.email,
        ipAddress: targetSession.ipAddress,
        duration,
      });

      // Performance: Send security notification email async (don't block response)
      if (targetSession.user.email) {
        sendSecurityAlert(
          targetSession.user.email,
          targetSession.user.name,
          targetSession.ipAddress
        ).catch((error) => {
          log.error('Failed to send security alert email', { 
            sessionId, 
            error: error instanceof Error ? error.message : String(error)
          });
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Session blocked and user notified',
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Impossible travel block failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to block session' },
        { status: 500 }
      );
    }
  }
);

