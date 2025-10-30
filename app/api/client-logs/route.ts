import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';

interface ClientLogPayload {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: Record<string, unknown>;
  timestamp: string;
  userAgent: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ClientLogPayload = await request.json();
    
    // Log to server Winston logger with client context
    const logContext = {
      ...payload.context,
      clientTimestamp: payload.timestamp,
      userAgent: payload.userAgent,
      clientUrl: payload.url,
      source: 'client',
    };

    switch (payload.level) {
      case 'error':
        log.error(`[Client] ${payload.message}`, logContext);
        break;
      case 'warn':
        log.warn(`[Client] ${payload.message}`, logContext);
        break;
      case 'info':
        log.info(`[Client] ${payload.message}`, logContext);
        break;
      case 'debug':
        log.debug(`[Client] ${payload.message}`, logContext);
        break;
    }

    return NextResponse.json({ success: true });
  } catch {
    // Don't throw errors for logging endpoint - silently fail
    return NextResponse.json({ success: false }, { status: 500 });
  }
}