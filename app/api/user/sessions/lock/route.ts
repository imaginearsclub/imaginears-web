import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import {
  lockSessionToIP,
  requireReAuth,
  freezeSession,
  unfreezeSession,
  detectSessionConflicts,
  autoResolveConflicts
} from '@/lib/session-locking';
import { getClientIP } from '@/lib/session-utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/sessions/lock
 * Session locking and security actions
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, sessionId, reason } = body;

    switch (action) {
      case 'lock_ip': {
        const ip = await getClientIP();
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId required' },
            { status: 400 }
          );
        }
        const result = await lockSessionToIP(sessionId, ip, reason);
        return NextResponse.json({ success: true, lock: result });
      }
      
      case 'require_reauth': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId required' },
            { status: 400 }
          );
        }
        const result = await requireReAuth(sessionId, reason);
        return NextResponse.json(result);
      }
      
      case 'freeze': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId required' },
            { status: 400 }
          );
        }
        const result = await freezeSession(sessionId, reason || 'Suspicious activity');
        return NextResponse.json(result);
      }
      
      case 'unfreeze': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId required' },
            { status: 400 }
          );
        }
        const result = await unfreezeSession(sessionId);
        return NextResponse.json(result);
      }
      
      case 'detect_conflicts': {
        const conflicts = await detectSessionConflicts(session.user.id);
        return NextResponse.json(conflicts);
      }
      
      case 'resolve_conflicts': {
        const strategy = body.strategy || 'keep_newest';
        const result = await autoResolveConflicts(session.user.id, strategy);
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Lock] Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

