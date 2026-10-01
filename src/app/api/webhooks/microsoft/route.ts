import { prisma } from '@/lib/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.validationToken) {
      return new Response(body.validationToken, { status: 200 });
    }

    for (const notification of body.value || []) {
      const connectedAccount = await prisma.connectedAccount.findFirst({
        where: { provider: 'MICROSOFT', isActive: true },
      });

      if (connectedAccount) {
        await prisma.connectedAccount.update({
          where: { id: connectedAccount.id },
          data: { lastSyncAt: new Date() },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Microsoft webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}