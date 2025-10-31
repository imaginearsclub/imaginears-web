import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { getUserTrustedDevices, registerTrustedDevice } from '@/lib/trusted-devices';
import { log } from '@/lib/logger';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/trusted-devices
 * Get all trusted devices for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const devices = await getUserTrustedDevices(session.user.id);

    return NextResponse.json({ devices });
  } catch (error) {
    log.error('Trusted Devices API: Failed to get devices', { error });
    return NextResponse.json(
      { error: 'Failed to retrieve trusted devices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/trusted-devices
 * Register a new trusted device or update existing one
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
    const { fingerprint, name, deviceType, browser, os } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    // Get IP address from headers
    const h = await headers();
    const forwardedFor = h.get('x-forwarded-for');
    const ipAddress = (forwardedFor ? forwardedFor.split(',')[0]?.trim() : null) || 
                      h.get('x-real-ip') || 
                      undefined;

    const device = await registerTrustedDevice(session.user.id, {
      fingerprint,
      name,
      deviceType,
      browser,
      os,
      ipAddress,
    });

    log.info('Trusted Devices: Device registered', {
      userId: session.user.id,
      deviceId: device.id,
      isNew: !!device.createdAt,
    });

    return NextResponse.json({
      success: true,
      device,
    });
  } catch (error) {
    log.error('Trusted Devices API: Failed to register device', { error });
    return NextResponse.json(
      { error: 'Failed to register trusted device' },
      { status: 500 }
    );
  }
}

