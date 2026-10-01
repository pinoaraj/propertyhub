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
          tenant: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      reportedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true, phone: true } },
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

  return (
    <TicketDetailClient
      initialTicket={ticket}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}