import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { CalendarView } from '@/components/dashboard/calendar-view';
import { CalendarFilters } from '@/components/dashboard/calendar-filters';

export default async function CalendarPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  // Get connected calendars
  const connectedAccounts = await prisma.connectedAccount.findMany({
    where: { userId: session.user.id, isActive: true },
    select: { provider: true },
  });

  // Get tickets with calendar events
  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      unit: { property: { managerId: session.user.id } },
      calendarEventId: { not: null },
      scheduledAt: { not: null },
    },
    include: {
      unit: { include: { property: true } },
      assignedTo: { select: { name: true, email: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // Get tasks with calendar events
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: session.user.id,
      calendarEventId: { not: null },
      dueDate: { not: null },
    },
    include: {
      ticket: { include: { unit: { include: { property: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage scheduled maintenance visits</p>
        </div>
      </div>

      <CalendarFilters connectedProviders={connectedAccounts.map(c => c.provider)} />

      <CalendarView
        tickets={tickets}
        tasks={tasks}
        connectedProviders={connectedAccounts.map(c => c.provider)}
      />
    </div>
  );
}