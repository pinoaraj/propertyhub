import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { TicketsList } from '@/components/dashboard/tickets-list';
import { TicketFilters } from '@/components/dashboard/ticket-filters';
import { Button } from '@/components/ui/button';
import { Plus, Wrench } from 'lucide-react';
import Link from 'next/link';

export default async function TicketsPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const { searchParams } = new URL('', 'http://localhost');
  const status = searchParams.get('status') || undefined;
  const priority = searchParams.get('priority') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;

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
      skip: (page - 1) * limit,
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage and track all maintenance requests</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tickets/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </div>

      <TicketFilters />

      <TicketsList tickets={tickets} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/tickets?page=${page - 1}&status=${status || ''}&priority=${priority || ''}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} tickets)
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/tickets?page=${page + 1}&status=${status || ''}&priority=${priority || ''}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}