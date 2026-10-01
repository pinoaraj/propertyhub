import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { createAuditLogEntry } from '@/lib/db/repositories';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.enum([
    'PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'HVAC',
    'APPLIANCE', 'SECURITY', 'CLEANING', 'PAINTING', 'LOCKSMITH', 'GENERAL'
  ]).optional(),
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).optional(),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  estimatedCost: z.number().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        unit: { include: { property: true, tenant: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const hasAccess =
      session.user.role === 'ADMIN' ||
      session.user.role === 'PROPERTY_MANAGER' ||
      ticket.reportedById === session.user.id ||
      ticket.assignedToId === session.user.id ||
      ticket.unit.tenantId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('GET ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const data = updateTicketSchema.parse(body);

    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: { unit: { include: { property: true } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit =
      session.user.role === 'ADMIN' ||
      session.user.role === 'PROPERTY_MANAGER' ||
      ticket.reportedById === session.user.id;

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldStatus = ticket.status;
    const oldAssignedToId = ticket.assignedToId;

    const updated = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'IN_PROGRESS' && !ticket.startedAt && { startedAt: new Date() }),
        ...(data.status === 'RESOLVED' && !ticket.resolvedAt && { resolvedAt: new Date() }),
      },
      include: {
        unit: { include: { property: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Log changes
    if (data.status && data.status !== oldStatus) {
      await createAuditLogEntry({
        actor: session.user.id,
        action: 'TICKET_STATUS_CHANGED',
        entityType: 'MaintenanceTicket',
        entityId: id,
        metadata: { oldStatus, newStatus: data.status },
      });
    }

    if (data.assignedToId !== undefined && data.assignedToId !== oldAssignedToId) {
      await createAuditLogEntry({
        actor: session.user.id,
        action: 'TICKET_ASSIGNED',
        entityType: 'MaintenanceTicket',
        entityId: id,
        metadata: { oldAssignedToId, newAssignedToId: data.assignedToId },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('PATCH ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Only admins and property managers can delete
    if (session.user.role !== 'ADMIN' && session.user.role !== 'PROPERTY_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.maintenanceTicket.delete({ where: { id } });

    await createAuditLogEntry({
      actor: session.user.id,
      action: 'TICKET_DELETED',
      entityType: 'MaintenanceTicket',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}