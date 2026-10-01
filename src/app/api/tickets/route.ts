import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { createAuditLogEntry } from '@/lib/db/repositories';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createTicketSchema = z.object({
  unitId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  category: z.enum([
    'PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'HVAC',
    'APPLIANCE', 'SECURITY', 'CLEANING', 'PAINTING', 'LOCKSMITH', 'GENERAL'
  ]),
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']).default('NORMAL'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    // Verify unit exists and user has access
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
      include: { property: true },
    });

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    // Check permissions
    const canCreate =
      session.user.role === 'ADMIN' ||
      session.user.role === 'PROPERTY_MANAGER' ||
      (session.user.role === 'TENANT' && unit.tenantId === session.user.id);

    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        unitId: data.unitId,
        reportedById: session.user.id,
      },
      include: {
        unit: { include: { property: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Create initial event
    await prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        type: 'CREATED',
        description: `Ticket created by ${session.user.name || session.user.email}`,
        metadata: { category: data.category, priority: data.priority },
        createdById: session.user.id,
      },
    });

    // Log audit
    await createAuditLogEntry({
      actor: session.user.id,
      action: 'MAINTENANCE_TICKET_CREATED',
      entityType: 'MaintenanceTicket',
      entityId: ticket.id,
      metadata: {
        unitId: data.unitId,
        category: data.category,
        priority: data.priority,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('POST ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const unitId = searchParams.get('unitId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    // Role-based filtering
    if (session.user.role === 'TENANT') {
      where.unit = { tenantId: session.user.id };
    } else if (session.user.role === 'SERVICE_TECH') {
      where.assignedToId = session.user.id;
    } else if (session.user.role === 'PROPERTY_MANAGER' || session.user.role === 'ADMIN') {
      where.unit = { property: { managerId: session.user.id } };
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (unitId) where.unitId = unitId;

    const [tickets, total] = await Promise.all([
      prisma.maintenanceTicket.findMany({
        where,
        include: {
          unit: { include: { property: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.maintenanceTicket.count({ where }),
    ]);

    return NextResponse.json({ tickets, total });
  } catch (error) {
    console.error('GET tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}