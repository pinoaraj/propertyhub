import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!['GOOGLE', 'MICROSOFT'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    await prisma.connectedAccount.update({
      where: { userId_provider: { userId: session.user.id, provider } },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ success: true, syncedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}