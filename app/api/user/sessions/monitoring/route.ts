import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/session';
import {
  getRealtimeStats,
  trackConcurrentSessions,
  detectRealTimeAnomalies,
  generateSessionTimeline,
  getUserEvents
} from '@/lib/session-monitoring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/sessions/monitoring
 * Real-time session monitoring data
 */
export async function GET(request: Request) {
  try {
    const session = await requirePermission("sessions:view_own");
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Forbidden: Missing permission \'sessions:view_own\'' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats'; // stats, concurrent, anomalies, timeline, events
    const days = parseInt(searchParams.get('days') || '30');

    switch (type) {
      case 'stats':
        const stats = await getRealtimeStats(session.user.id);
        return NextResponse.json(stats);
      
      case 'concurrent':
        const concurrent = await trackConcurrentSessions(session.user.id);
        return NextResponse.json(concurrent);
      
      case 'anomalies':
        const anomalies = await detectRealTimeAnomalies(session.user.id);
        return NextResponse.json(anomalies);
      
      case 'timeline':
        const timeline = await generateSessionTimeline(session.user.id, days);
        return NextResponse.json({ timeline });
      
      case 'events':
        const limit = parseInt(searchParams.get('limit') || '50');
        const events = getUserEvents(session.user.id, limit);
        return NextResponse.json({ events });
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Monitoring] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

