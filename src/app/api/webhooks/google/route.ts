import { prisma } from '@/lib/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const channelId = request.headers.get('x-goog-channel-id');
    const resourceId = request.headers.get('x-goog-resource-id');
    const state = request.headers.get('x-goog-resource-state');

    if (!channelId || !resourceId) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    if (state === 'sync') {
      return NextResponse.json({ success: true });
    }

    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: { provider: 'GOOGLE', isActive: true },
    });

    if (connectedAccount) {
      await prisma.connectedAccount.update({
        where: { id: connectedAccount.id },
        data: { lastSyncAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}