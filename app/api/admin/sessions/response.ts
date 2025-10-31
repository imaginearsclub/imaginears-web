import { NextResponse } from 'next/server';

function getRequestId(req: Request): string {
  return req.headers.get('x-request-id') || cryptoRandomId();
}

function cryptoRandomId(): string {
  // Simple, short random id suitable for logs/headers
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function jsonOk(req: Request, body: unknown, init?: ResponseInit) {
  const requestId = getRequestId(req);
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'X-Request-Id': requestId,
    },
  });
}

export function jsonError(req: Request, message: string, status = 400, extra?: Record<string, unknown>) {
  const requestId = getRequestId(req);
  return NextResponse.json({ error: message, requestId, ...(extra || {}) }, {
    status,
    headers: {
      'X-Request-Id': requestId,
    },
  });
}
