import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { notFound } from 'next/navigation';
import { TicketDetailClient } from '@/components/dashboard/ticket-detail-client';
import { formatDateTime } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    return null;
  }

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      unit: {
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
        },
      },
      reportedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      events: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!ticket) {
    notFound();
  }

  // Check permissions
  const hasAccess =
    session.user.role === 'ADMIN' ||
    session.user.role === 'PROPERTY_MANAGER' ||
    ticket.reportedById === session.user.id ||
    ticket.assignedToId === session.user.id ||
    ticket.unit.tenantId === session.user.id;

  if (!hasAccess) {
    notFound();
  }

  // Serialize dates for client component
  const serializedTicket = {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    scheduledAt: ticket.scheduledAt?.toISOString() || null,
    startedAt: ticket.startedAt?.toISOString() || null,
    resolvedAt: ticket.resolvedAt?.toISOString() || null,
    estimatedCost: ticket.estimatedCost?.toString() || null,
    actualCost: ticket.actualCost?.toString() || null,
    unit: {
      ...ticket.unit,
      property: ticket.unit.property,
      tenant: ticket.unit.tenant,
    },
    reportedBy: ticket.reportedBy,
    assignedTo: ticket.assignedTo,
    events: ticket.events.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  };

  return (
    <TicketDetailClient
      initialTicket={serializedTicket}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}