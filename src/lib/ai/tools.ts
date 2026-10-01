import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma/client';
import { getCalendarProvider, getAllCalendarProviders } from '@/lib/calendar/providers';
import type { CalendarProvider } from '@/types';

export const checkCalendarFreebusy = tool({
  description: 'Check available time slots across connected calendars (Google and/or Microsoft)',
  parameters: z.object({
    startDate: z.string().describe('Start date in ISO format'),
    endDate: z.string().describe('End date in ISO format'),
    provider: z.enum(['google', 'microsoft']).optional().describe('Specific provider to check (optional)'),
  }),
  execute: async ({ startDate, endDate, provider }) => {
    const userId = 'current-user-id'; // Will be injected from session
    const providers = provider ? [provider.toUpperCase() as CalendarProvider] : ['GOOGLE', 'MICROSOFT'];
    const allSlots: Array<{ start: Date; end: Date; isAvailable: boolean; provider: string }> = [];

    for (const p of providers) {
      const calProvider = await getCalendarProvider(userId, p as CalendarProvider);
      if (calProvider) {
        const slots = await calProvider.getAvailability(new Date(startDate), new Date(endDate));
        allSlots.push(...slots.map((s) => ({ ...s, provider: p })));
      }
    }

    const availableSlots = allSlots.filter((s) => s.isAvailable);
    return {
      availableSlots: availableSlots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        provider: s.provider,
      })),
      totalProviders: providers.length,
    };
  },
});

export const scheduleMaintenanceVisit = tool({
  description: 'Schedule a maintenance visit in the calendar and link it to a ticket',
  parameters: z.object({
    ticketId: z.string().describe('ID of the maintenance ticket'),
    startTime: z.string().describe('Start time in ISO format'),
    endTime: z.string().describe('End time in ISO format'),
    attendeeEmail: z.string().email().describe('Email of the attendee (tenant/technician)'),
    summary: z.string().describe('Event summary/title'),
    provider: z.enum(['google', 'microsoft']).describe('Calendar provider to use'),
  }),
  execute: async ({ ticketId, startTime, endTime, attendeeEmail, summary, provider }) => {
    const userId = 'current-user-id';
    const calProvider = await getCalendarProvider(userId, provider.toUpperCase() as CalendarProvider);

    if (!calProvider) {
      throw new Error(`${provider} calendar not connected`);
    }

    const { eventId, link } = await calProvider.createEvent({
      summary,
      description: `Maintenance visit for ticket ${ticketId}`,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees: [attendeeEmail],
    });

    await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        calendarEventId: eventId,
        calendarProvider: provider.toUpperCase() as CalendarProvider,
        scheduledAt: new Date(startTime),
        status: 'ASSIGNED',
      },
    });

    await prisma.ticketEvent.create({
      data: {
        ticketId,
        type: 'SCHEDULED',
        description: `Visit scheduled for ${new Date(startTime).toLocaleString()} via ${provider}`,
        metadata: { eventId, calendarLink: link, provider },
      },
    });

    return { eventId, link, provider };
  },
});

export const createMaintenanceTicket = tool({
  description: 'Create a new maintenance ticket',
  parameters: z.object({
    unitNumber: z.string().describe('Unit number (e.g., "A-101")'),
    issueDescription: z.string().describe('Detailed description of the issue'),
    category: z.enum([
      'PLUMBING',
      'ELECTRICAL',
      'STRUCTURAL',
      'HVAC',
      'APPLIANCE',
      'SECURITY',
      'CLEANING',
      'PAINTING',
      'LOCKSMITH',
      'GENERAL',
    ]),
    priority: z.enum(['URGENT', 'NORMAL', 'LOW']).default('NORMAL'),
  }),
  execute: async ({ unitNumber, issueDescription, category, priority }) => {
    const userId = 'current-user-id';

    const unit = await prisma.unit.findFirst({
      where: { unitNumber, isActive: true },
      include: { property: true },
    });

    if (!unit) {
      throw new Error(`Unit ${unitNumber} not found`);
    }

    const ticket = await prisma.maintenanceTicket.create({
      data: {
        title: `${category} issue in Unit ${unitNumber}`,
        description: issueDescription,
        category,
        priority,
        unitId: unit.id,
        reportedById: userId,
      },
      include: { unit: { include: { property: true } } },
    });

    await prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        type: 'CREATED',
        description: `Ticket created by user`,
        metadata: { category, priority },
      },
    });

    return {
      ticketId: ticket.id,
      title: ticket.title,
      unit: `${ticket.unit.property.name} - ${ticket.unit.unitNumber}`,
      status: ticket.status,
      priority: ticket.priority,
    };
  },
});

export const summarizeDailyAgenda = tool({
  description: 'Get a summary of today\'s agenda including calendar events and pending tasks',
  parameters: z.object({
    targetDate: z.string().optional().describe('Date in ISO format (defaults to today)'),
  }),
  execute: async ({ targetDate }) => {
    const userId = 'current-user-id';
    const date = targetDate ? new Date(targetDate) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const providers = await getAllCalendarProviders(userId);
    const calendarEvents = [];

    for (const provider of providers) {
      const slots = await provider.getAvailability(startOfDay, endOfDay);
      const busyEvents = slots.filter((s) => !s.isAvailable);
      calendarEvents.push(
        ...busyEvents.map((e) => ({
          start: e.start.toISOString(),
          end: e.end.toISOString(),
          title: 'Calendar Event',
        }))
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: 'PENDING',
        dueDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        ticket: { select: { id: true, title: true, unit: { select: { unitNumber: true } } } },
      },
    });

    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        assignedToId: userId,
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
      },
      include: { unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
    });

    return {
      date: date.toISOString().split('T')[0],
      calendarEvents: calendarEvents.map((e) => ({
        time: `${new Date(e.start).toLocaleTimeString()} - ${new Date(e.end).toLocaleTimeString()}`,
        title: e.title,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueTime: new Date(t.dueDate).toLocaleTimeString(),
        ticket: t.ticket ? `${t.ticket.title} (Unit ${t.ticket.unit.unitNumber})` : null,
      })),
      tickets: tickets.map((t) => ({
        id: t.id,
        title: t.title,
        unit: `${t.unit.property.name} - ${t.unit.unitNumber}`,
        priority: t.priority,
        status: t.status,
      })),
    };
  },
});

export const getTicketDetails = tool({
  description: 'Get detailed information about a maintenance ticket',
  parameters: z.object({
    ticketId: z.string().describe('ID of the maintenance ticket'),
  }),
  execute: async ({ ticketId }) => {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id: ticketId },
      include: {
        unit: { include: { property: true, tenant: true } },
        reportedBy: true,
        assignedTo: true,
        events: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      unit: {
        unitNumber: ticket.unit.unitNumber,
        property: ticket.unit.property.name,
        tenant: ticket.unit.tenant ? { name: ticket.unit.tenant.name, email: ticket.unit.tenant.email } : null,
      },
      reportedBy: ticket.reportedBy.name,
      assignedTo: ticket.assignedTo ? { name: ticket.assignedTo.name, email: ticket.assignedTo.email } : null,
      scheduledAt: ticket.scheduledAt?.toISOString(),
      estimatedCost: ticket.estimatedCost?.toString(),
      events: ticket.events.map((e) => ({
        type: e.type,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  },
});

export const updateTicketStatus = tool({
  description: 'Update the status of a maintenance ticket',
  parameters: z.object({
    ticketId: z.string().describe('ID of the maintenance ticket'),
    status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    note: z.string().optional().describe('Optional note about the status change'),
  }),
  execute: async ({ ticketId, status, note }) => {
    const userId = 'current-user-id';

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(status === 'IN_PROGRESS' && { startedAt: new Date() }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    await prisma.ticketEvent.create({
      data: {
        ticketId,
        type: 'STATUS_CHANGED',
        description: `Status changed to ${status}${note ? `: ${note}` : ''}`,
        metadata: { previousStatus: ticket.status, note },
        createdById: userId,
      },
    });

    return { ticketId, status, updatedAt: ticket.updatedAt.toISOString() };
  },
});

export const assignTicket = tool({
  description: 'Assign a maintenance ticket to a technician',
  parameters: z.object({
    ticketId: z.string().describe('ID of the maintenance ticket'),
    technicianId: z.string().describe('ID of the technician to assign'),
  }),
  execute: async ({ ticketId, technicianId }) => {
    const ticket = await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: { assignedToId: technicianId, status: 'ASSIGNED' },
    });

    await prisma.ticketEvent.create({
      data: {
        ticketId,
        type: 'ASSIGNED',
        description: `Assigned to technician`,
        metadata: { technicianId },
      },
    });

    return { ticketId, assignedToId: technicianId, status: 'ASSIGNED' };
  },
});

export const listUserTickets = tool({
  description: 'List tickets for the current user (created or assigned)',
  parameters: z.object({
    status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    limit: z.number().default(10),
  }),
  execute: async ({ status, limit }) => {
    const userId = 'current-user-id';

    const tickets = await prisma.maintenanceTicket.findMany({
      where: {
        OR: [{ reportedById: userId }, { assignedToId: userId }],
        ...(status && { status }),
      },
      include: {
        unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        assignedTo: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return tickets.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      unit: `${t.unit.property.name} - ${t.unit.unitNumber}`,
      assignedTo: t.assignedTo?.name || 'Unassigned',
      createdAt: t.createdAt.toISOString(),
    }));
  },
});

export const tools = {
  checkCalendarFreebusy,
  scheduleMaintenanceVisit,
  createMaintenanceTicket,
  summarizeDailyAgenda,
  getTicketDetails,
  updateTicketStatus,
  assignTicket,
  listUserTickets,
};