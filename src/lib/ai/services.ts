import { generateStructuredJson, isAIConfigured } from './client';
import { createAuditLogEntry } from '@/lib/db/repositories';
import { z } from 'zod';
import {
  maintenanceTicketSchema,
  scheduleVisitSchema,
  dailyAgendaSchema,
  ticketDetailsSchema,
  availabilitySchema,
  type MaintenanceTicketInput,
  type ScheduleVisitInput,
  type DailyAgendaOutput,
  type TicketDetailsOutput,
  type AvailabilityOutput,
} from './schemas';
import { getCalendarProvider, getAllCalendarProviders } from '@/lib/calendar/providers';
import { prisma } from '@/lib/prisma/client';

export interface ScoreMaintenanceUrgencyInput {
  ticketId: string;
  forceRefresh?: boolean;
}

export interface ScoreMaintenanceUrgencyResult {
  score: number;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  reasonCodes: string[];
  riskFlags: string[];
  recommendation: 'monitor' | 'schedule' | 'priority' | 'urgent';
  source: 'cache' | 'ai';
  warning?: string;
}

const urgencyAssessmentSchema = z.object({
  score: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  summary: z.string().min(12).max(1200),
  reasonCodes: z.array(z.string().min(2).max(80)).min(1).max(12),
  riskFlags: z.array(z.string().min(2).max(200)).min(1).max(8),
  recommendation: z.enum(['monitor', 'schedule', 'priority', 'urgent']),
});

function buildUrgencyPrompt(ticket: any) {
  return `
You are an advisory maintenance triage assistant for property managers.

Important constraints:
- You are advisory only. Do not make autonomous operational decisions.
- Respond with strict JSON only.

Return exactly this JSON shape:
{
  "score": number 0-100,
  "confidence": "low" | "medium" | "high",
  "summary": string,
  "reasonCodes": string[],
  "riskFlags": string[],
  "recommendation": "monitor" | "schedule" | "priority" | "urgent"
}

Scoring guidance:
- Higher score means greater urgency and safety/asset risk.
- Consider safety hazards, water leaks, electrical risk, security concerns, and potential property damage escalation.
- reasonCodes must be compact uppercase snake-case codes (e.g., WATER_DAMAGE_RISK).
- riskFlags should be concise, practical manager-facing flags.

Maintenance request data:
${JSON.stringify(ticket, null, 2)}
`.trim();
}

function normalizeUrgencyAssessment(assessment: any) {
  const normalizeList = (items: string[], fallback: string) => {
    const cleaned = Array.from(
      new Set(items.map(item => item.trim()).filter(item => item.length > 0))
    );
    return cleaned.length > 0 ? cleaned : [fallback];
  };

  return {
    score: Math.max(0, Math.min(100, Math.round(assessment.score))),
    confidence: assessment.confidence,
    summary: assessment.summary.trim(),
    reasonCodes: normalizeList(assessment.reasonCodes, 'MANUAL_REVIEW_REQUIRED').map(code =>
      code.toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
    ),
    riskFlags: normalizeList(assessment.riskFlags, 'Insufficient data to determine specific risk flags.'),
    recommendation: assessment.recommendation,
  };
}

export async function scoreMaintenanceUrgency({
  ticketId,
  forceRefresh = false,
}: ScoreMaintenanceUrgencyInput): Promise<ScoreMaintenanceUrgencyResult> {
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    include: {
      unit: { include: { property: true, tenant: true } },
      reportedBy: true,
      assignedTo: true,
    },
  });

  if (!ticket) {
    throw new Error('Maintenance ticket not found');
  }

  // Check cache first (stored in ticket metadata or separate table)
  // For now, we'll always score with AI if configured
  if (!isAIConfigured()) {
    return {
      score: 50,
      confidence: 'low',
      summary: 'AI scoring unavailable - manual review required',
      reasonCodes: ['AI_UNAVAILABLE'],
      riskFlags: ['Unable to assess urgency automatically'],
      recommendation: 'schedule',
      source: 'cache',
      warning: 'OPENAI_API_KEY not configured, using default score',
    };
  }

  try {
    const modelAssessment = await generateStructuredJson({
      prompt: buildUrgencyPrompt({
        ticket: {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          createdAt: ticket.createdAt.toISOString(),
        },
        unit: {
          unitNumber: ticket.unit.unitNumber,
          propertyName: ticket.unit.property.name,
        },
        tenant: ticket.unit.tenant
          ? { name: ticket.unit.tenant.name, email: ticket.unit.tenant.email }
          : null,
      }),
      schema: urgencyAssessmentSchema,
      temperature: 0.1,
      maxOutputTokens: 900,
    });

    const normalizedAssessment = normalizeUrgencyAssessment(modelAssessment);

    // Store in audit log
    await createAuditLogEntry({
      actor: 'ai-service',
      action: 'MAINTENANCE_URGENCY_SCORED',
      entityType: 'MaintenanceTicket',
      entityId: ticketId,
      metadata: {
        source: 'ai',
        forceRefresh,
        score: normalizedAssessment.score,
        recommendation: normalizedAssessment.recommendation,
      },
    });

    return {
      ...normalizedAssessment,
      source: 'ai',
    };
  } catch (error) {
    console.error('scoreMaintenanceUrgency failed', error);

    await createAuditLogEntry({
      actor: 'ai-service',
      action: 'MAINTENANCE_URGENCY_SCORING_FAILED',
      entityType: 'MaintenanceTicket',
      entityId: ticketId,
      metadata: {
        forceRefresh,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }).catch(() => {});

    return {
      score: 50,
      confidence: 'low',
      summary: 'AI scoring failed - manual review required',
      reasonCodes: ['AI_ERROR'],
      riskFlags: ['AI scoring failed, please review manually'],
      recommendation: 'schedule',
      source: 'cache',
      warning: 'AI urgency scoring failed, using default score',
    };
  }
}

export async function createMaintenanceTicketWithAI(input: MaintenanceTicketInput, userId: string) {
  const validated = maintenanceTicketSchema.parse(input);

  // Find unit by number
  const unit = await prisma.unit.findFirst({
    where: { unitNumber: validated.unitNumber, isActive: true },
    include: { property: true },
  });

  if (!unit) {
    throw new Error(`Unit ${validated.unitNumber} not found`);
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      title: `${validated.category} issue in Unit ${validated.unitNumber}`,
      description: validated.issueDescription,
      category: validated.category,
      priority: validated.priority,
      unitId: unit.id,
      reportedById: userId,
    },
    include: { unit: { include: { property: true } } },
  });

  await createAuditLogEntry({
    actor: 'user',
    action: 'MAINTENANCE_TICKET_CREATED',
    entityType: 'MaintenanceTicket',
    entityId: ticket.id,
    metadata: { category: validated.category, priority: validated.priority, userId },
  });

  return ticket;
}

export async function scheduleMaintenanceVisitWithAI(
  input: ScheduleVisitInput,
  userId: string
) {
  const validated = scheduleVisitSchema.parse(input);

  const provider = await getCalendarProvider(userId, validated.provider.toUpperCase() as 'GOOGLE' | 'MICROSOFT');
  if (!provider) {
    throw new Error(`${validated.provider} calendar not connected`);
  }

  const { eventId, link } = await provider.createEvent({
    summary: validated.summary,
    description: `Maintenance visit for ticket ${validated.ticketId}`,
    startTime: new Date(validated.startTime),
    endTime: new Date(validated.endTime),
    attendees: [validated.attendeeEmail],
  });

  await prisma.maintenanceTicket.update({
    where: { id: validated.ticketId },
    data: {
      calendarEventId: eventId,
      calendarProvider: validated.provider.toUpperCase() as 'GOOGLE' | 'MICROSOFT',
      scheduledAt: new Date(validated.startTime),
      status: 'ASSIGNED',
    },
  });

  await createAuditLogEntry({
    actor: 'user',
    action: 'MAINTENANCE_VISIT_SCHEDULED',
    entityType: 'MaintenanceTicket',
    entityId: validated.ticketId,
    metadata: { eventId, calendarLink: link, provider: validated.provider },
  });

  return { eventId, link, provider: validated.provider };
}

export async function getDailyAgendaWithAI(userId: string, targetDate?: Date): Promise<DailyAgendaOutput> {
  const date = targetDate || new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const providers = await getAllCalendarProviders(userId);
  const calendarEvents: any[] = [];

  for (const provider of providers) {
    const slots = await provider.getAvailability(startOfDay, endOfDay);
    const busyEvents = slots.filter(s => !s.isAvailable);
    calendarEvents.push(
      ...busyEvents.map(e => ({
        time: `${e.start.toLocaleTimeString()} - ${e.end.toLocaleTimeString()}`,
        title: 'Calendar Event',
        provider: 'GOOGLE', // Would need to track which provider
        eventId: '',
      }))
    );
  }

  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId, status: 'PENDING', dueDate: { gte: startOfDay, lte: endOfDay } },
    include: { ticket: { select: { id: true, title: true, unit: { select: { unitNumber: true } } } } },
    orderBy: { dueDate: 'asc' },
  });

  const tickets = await prisma.maintenanceTicket.findMany({
    where: { assignedToId: userId, status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } },
    include: { unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
  });

  return {
    date: date.toISOString().split('T')[0],
    calendarEvents,
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      dueTime: new Date(t.dueDate).toLocaleTimeString(),
      ticketTitle: t.ticket ? `${t.ticket.title} (Unit ${t.ticket.unit.unitNumber})` : undefined,
    })),
    tickets: tickets.map(t => ({
      id: t.id,
      title: t.title,
      unit: `${t.unit.property.name} - ${t.unit.unitNumber}`,
      priority: t.priority,
      status: t.status,
    })),
  };
}

export async function getTicketDetailsWithAI(ticketId: string): Promise<TicketDetailsOutput> {
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
      tenant: ticket.unit.tenant
        ? { name: ticket.unit.tenant.name || '', email: ticket.unit.tenant.email }
        : null,
    },
    reportedBy: ticket.reportedBy.name || '',
    assignedTo: ticket.assignedTo
      ? { name: ticket.assignedTo.name || '', email: ticket.assignedTo.email }
      : null,
    scheduledAt: ticket.scheduledAt?.toISOString() || null,
    estimatedCost: ticket.estimatedCost?.toString() || null,
    events: ticket.events.map(e => ({
      type: e.type,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export async function checkAvailabilityWithAI(
  userId: string,
  startDate: Date,
  endDate: Date,
  provider?: 'GOOGLE' | 'MICROSOFT'
): Promise<AvailabilityOutput> {
  const providers = provider
    ? [await getCalendarProvider(userId, provider)].filter((p): p is NonNullable<typeof p> => p !== null)
    : await getAllCalendarProviders(userId);

  const allSlots: any[] = [];

  for (const p of providers) {
    const slots = await p.getAvailability(startDate, endDate);
    allSlots.push(...slots.map(s => ({ ...s, provider: 'GOOGLE' }))); // Would track actual provider
  }

  const availableSlots = allSlots.filter(s => s.isAvailable);

  return {
    availableSlots: availableSlots.map(s => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      provider: 'GOOGLE',
    })),
    totalProviders: providers.length,
  };
}