import { z } from 'zod';

export const maintenanceTicketSchema = z.object({
  unitNumber: z.string().min(1).max(50),
  issueDescription: z.string().min(10).max(5000),
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
});

export type MaintenanceTicketInput = z.infer<typeof maintenanceTicketSchema>;

export const scheduleVisitSchema = z.object({
  ticketId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  attendeeEmail: z.string().email(),
  summary: z.string().min(5).max(200),
  provider: z.enum(['google', 'microsoft']),
});

export type ScheduleVisitInput = z.infer<typeof scheduleVisitSchema>;

export const dailyAgendaSchema = z.object({
  date: z.string().date(),
  calendarEvents: z.array(
    z.object({
      time: z.string(),
      title: z.string(),
      provider: z.enum(['GOOGLE', 'MICROSOFT']),
      eventId: z.string().optional(),
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dueTime: z.string(),
      ticketTitle: z.string().optional(),
    })
  ),
  tickets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      unit: z.string(),
      priority: z.enum(['URGENT', 'NORMAL', 'LOW']),
      status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    })
  ),
});

export type DailyAgendaOutput = z.infer<typeof dailyAgendaSchema>;

export const ticketDetailsSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
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
  priority: z.enum(['URGENT', 'NORMAL', 'LOW']),
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  unit: z.object({
    unitNumber: z.string(),
    property: z.string(),
    tenant: z.object({ name: z.string(), email: z.string() }).nullable(),
  }),
  reportedBy: z.string(),
  assignedTo: z.object({ name: z.string(), email: z.string() }).nullable(),
  scheduledAt: z.string().datetime().nullable(),
  estimatedCost: z.string().nullable(),
  events: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      createdAt: z.string().datetime(),
    })
  ),
});

export type TicketDetailsOutput = z.infer<typeof ticketDetailsSchema>;

export const availabilitySchema = z.object({
  availableSlots: z.array(
    z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
      provider: z.enum(['GOOGLE', 'MICROSOFT']),
    })
  ),
  totalProviders: z.number(),
});

export type AvailabilityOutput = z.infer<typeof availabilitySchema>;

export const chatResponseSchema = z.object({
  message: z.string(),
  toolCalls: z.array(
    z.object({
      name: z.string(),
      arguments: z.record(z.unknown()),
    })
  ).optional(),
  actionCard: z.object({
    type: z.enum(['confirm_event', 'create_ticket', 'schedule_visit']),
    title: z.string(),
    description: z.string(),
    data: z.record(z.unknown()),
  }).optional(),
});

export type ChatResponseOutput = z.infer<typeof chatResponseSchema>;