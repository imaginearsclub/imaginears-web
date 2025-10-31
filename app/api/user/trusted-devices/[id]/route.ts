import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { revokeTrustedDevice, deleteTrustedDevice } from '@/lib/trusted-devices';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/user/trusted-devices/[id]
 * Delete a trusted device
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    await deleteTrustedDevice(session.user.id, id);

    log.info('Trusted Devices: Device deleted', {
      userId: session.user.id,
      deviceId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Device removed successfully',
    });
  } catch (error) {
    log.error('Trusted Devices API: Failed to delete device', { error });
    return NextResponse.json(
      { error: 'Failed to delete trusted device' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/trusted-devices/[id]
 * Update a trusted device (e.g., revoke trust)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'revoke') {
      await revokeTrustedDevice(session.user.id, id);

      log.info('Trusted Devices: Device trust revoked', {
        userId: session.user.id,
        deviceId: id,
      });

      return NextResponse.json({
        success: true,
        message: 'Device trust revoked successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    log.error('Trusted Devices API: Failed to update device', { error });
    return NextResponse.json(
      { error: 'Failed to update trusted device' },
      { status: 500 }
    );
  }
}

