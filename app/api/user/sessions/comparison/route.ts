import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import {
  compareAllUserSessions,
  detectSessionTakeover,
  analyzeBehavioralPatterns,
  findDuplicateSessions
} from '@/lib/session-comparison';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/sessions/comparison
 * Session comparison and analysis
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'conflicts'; // conflicts, takeover, patterns, duplicates
    const days = parseInt(searchParams.get('days') || '30');

    switch (type) {
      case 'conflicts':
        const conflicts = await compareAllUserSessions(session.user.id);
        return NextResponse.json(conflicts);
      
      case 'takeover':
        const takeover = await detectSessionTakeover(session.user.id);
        return NextResponse.json(takeover);
      
      case 'patterns':
        const patterns = await analyzeBehavioralPatterns(session.user.id, days);
        return NextResponse.json(patterns);
      
      case 'duplicates':
        const duplicates = await findDuplicateSessions(session.user.id);
        return NextResponse.json(duplicates);
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Comparison] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}

