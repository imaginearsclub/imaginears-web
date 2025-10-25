import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { exportSessions, exportActivities, type ExportOptions } from '@/lib/session-export';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/sessions/export
 * Export sessions and activities
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
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'json' | 'xlsx' | 'pdf';
    const type = searchParams.get('type') || 'sessions'; // sessions or activities
    const includeActivities = searchParams.get('includeActivities') === 'true';
    const includeSuspicious = searchParams.get('includeSuspicious') !== 'false';
    const dateFrom = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const dateTo = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    const options: ExportOptions = {
      userId: session.user.id,
      format,
      includeActivities,
      includeSuspicious,
      dateFrom,
      dateTo,
    };

    const result = type === 'activities'
      ? await exportActivities(options)
      : await exportSessions(options);

    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error('[Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

