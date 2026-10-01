import { prisma } from '@/lib/prisma/client';
import type { MaintenanceTicket, TicketStatus, TicketPriority, TicketCategory } from '@/types';

export interface CreateMaintenanceTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  unitId: string;
  reportedById: string;
  assignedToId?: string;
  estimatedCost?: number;
}

export interface UpdateMaintenanceTicketInput {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  resolvedAt?: Date | null;
  calendarEventId?: string | null;
  calendarProvider?: 'GOOGLE' | 'MICROSOFT' | null;
}

export async function createMaintenanceTicket(input: CreateMaintenanceTicketInput) {
  return prisma.maintenanceTicket.create({
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      unitId: input.unitId,
      reportedById: input.reportedById,
      assignedToId: input.assignedToId,
      estimatedCost: input.estimatedCost,
    },
    include: {
      unit: {
        include: { property: true },
      },
      reportedBy: true,
      assignedTo: true,
    },
  });
}

export async function findMaintenanceTicketById(id: string) {
  return prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      unit: { include: { property: true, tenant: true } },
      reportedBy: true,
      assignedTo: true,
      events: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function findMaintenanceTickets({
  userId,
  role,
  status,
  priority,
  unitId,
  propertyId,
  limit = 20,
  offset = 0,
}: {
  userId: string;
  role: string;
  status?: TicketStatus | TicketStatus[];
  priority?: TicketPriority;
  unitId?: string;
  propertyId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  // Role-based filtering
  if (role === 'TENANT') {
    where.unit = { tenantId: userId };
  } else if (role === 'SERVICE_TECH') {
    where.assignedToId = userId;
  } else if (role === 'PROPERTY_MANAGER' || role === 'ADMIN') {
    where.unit = { property: { managerId: userId } };
  }

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }
  if (priority) where.priority = priority;
  if (unitId) where.unitId = unitId;
  if (propertyId) where.unit = { ...where.unit, propertyId };

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

  return { tickets, total };
}

export async function updateMaintenanceTicket(id: string, input: UpdateMaintenanceTicketInput) {
  return prisma.maintenanceTicket.update({
    where: { id },
    data: input,
    include: {
      unit: { include: { property: true } },
      assignedTo: true,
      reportedBy: true,
    },
  });
}

export async function deleteMaintenanceTicket(id: string) {
  return prisma.maintenanceTicket.delete({ where: { id } });
}

export async function createTicketEvent(
  ticketId: string,
  type: string,
  description: string,
  metadata?: Record<string, unknown>,
  createdById?: string
) {
  return prisma.ticketEvent.create({
    data: {
      ticketId,
      type,
      description,
      metadata: metadata as any,
      createdById,
    },
  });
}

export async function findTicketEvents(ticketId: string, limit = 50) {
  return prisma.ticketEvent.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}