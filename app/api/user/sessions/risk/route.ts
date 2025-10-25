import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/session';
import { 
  getUserRiskHistory, 
  getRiskStatistics,
  calculateSessionRisk 
} from '@/lib/session-risk-scoring';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/sessions/risk
 * Get risk assessment and statistics
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
    const type = searchParams.get('type') || 'statistics'; // statistics, history, current
    const days = parseInt(searchParams.get('days') || '30');

    switch (type) {
      case 'statistics':
        const stats = await getRiskStatistics(session.user.id);
        return NextResponse.json(stats);
      
      case 'history':
        const history = await getUserRiskHistory(session.user.id, days);
        return NextResponse.json({ history });
      
      case 'current': {
        // Get current session risk
        const currentSession = await prisma.session.findUnique({
          where: { token: request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1] || '' },
        });
        
        if (!currentSession) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }
        
        const risk = await calculateSessionRisk({
          userId: session.user.id,
          sessionId: currentSession.id,
          ip: currentSession.ipAddress || '',
          country: currentSession.country,
          city: currentSession.city,
          deviceType: currentSession.deviceType,
          deviceName: currentSession.deviceName,
          browser: currentSession.browser,
          isNewDevice: currentSession.trustLevel === 0,
          isNewLocation: currentSession.trustLevel === 0,
        });
        
        return NextResponse.json({ risk });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Risk] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk data' },
      { status: 500 }
    );
  }
}

