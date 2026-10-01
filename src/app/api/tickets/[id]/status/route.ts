import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { createAuditLogEntry } from '@/lib/db/repositories';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, note } = statusSchema.parse(body);

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: { unit: { include: { property: true } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canUpdate =
      session.user.role === 'ADMIN' ||
      session.user.role === 'PROPERTY_MANAGER' ||
      ticket.assignedToId === session.user.id ||
      ticket.reportedById === session.user.id;

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldStatus = ticket.status;

    const updated = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status,
        ...(status === 'IN_PROGRESS' && !ticket.startedAt && { startedAt: new Date() }),
        ...(status === 'RESOLVED' && !ticket.resolvedAt && { resolvedAt: new Date() }),
      },
      include: {
        unit: { include: { property: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Create event
    await prisma.ticketEvent.create({
      data: {
        ticketId: id,
        type: 'STATUS_CHANGED',
        description: `Status changed from ${oldStatus} to ${status}${note ? `: ${note}` : ''}`,
        metadata: { oldStatus, newStatus: status, note },
        createdById: session.user.id,
      },
    });

    // Log audit
    await createAuditLogEntry({
      actor: session.user.id,
      action: 'TICKET_STATUS_CHANGED',
      entityType: 'MaintenanceTicket',
      entityId: id,
      metadata: { oldStatus, newStatus: status, note },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('PATCH ticket status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}