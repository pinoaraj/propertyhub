import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentTickets } from '@/components/dashboard/recent-tickets';
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    return null; // Will redirect via middleware
  }

  // Fetch stats
  const [
    totalProperties,
    totalUnits,
    occupiedUnits,
    openTickets,
    urgentTickets,
    upcomingTasks,
  ] = await Promise.all([
    prisma.property.count({ where: { managerId: session.user.id, isActive: true } }),
    prisma.unit.count({ where: { property: { managerId: session.user.id }, isActive: true } }),
    prisma.unit.count({ where: { property: { managerId: session.user.id }, isOccupied: true, isActive: true } }),
    prisma.maintenanceTicket.count({
      where: { unit: { property: { managerId: session.user.id } }, status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } },
    }),
    prisma.maintenanceTicket.count({
      where: { unit: { property: { managerId: session.user.id } }, priority: 'URGENT', status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } },
    }),
    prisma.task.count({
      where: { assigneeId: session.user.id, status: 'PENDING', dueDate: { gte: new Date() } },
      take: 5,
      orderBy: { dueDate: 'asc' },
    }),
  ]);

  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Fetch recent tickets
  const recentTickets = await prisma.maintenanceTicket.findMany({
    where: { unit: { property: { managerId: session.user.id } } },
    include: {
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      assignedTo: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch upcoming tasks for current user
  const tasks = await prisma.task.findMany({
    where: { assigneeId: session.user.id, status: 'PENDING', dueDate: { gte: new Date() } },
    include: { ticket: { select: { id: true, title: true, unit: { select: { unitNumber: true } } } } },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {session.user.name || 'User'}. Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats
        stats={[
          { label: 'Properties', value: totalProperties, icon: 'Building2', trend: null },
          { label: 'Total Units', value: totalUnits, icon: 'Home', trend: null },
          { label: 'Occupancy', value: `${occupancyRate}%`, icon: 'Users', trend: occupancyRate >= 90 ? 'up' : occupancyRate >= 70 ? 'neutral' : 'down' },
          { label: 'Open Tickets', value: openTickets, icon: 'Wrench', trend: openTickets > 10 ? 'up' : 'down' },
          { label: 'Urgent Tickets', value: urgentTickets, icon: 'AlertTriangle', trend: urgentTickets > 0 ? 'up' : 'down', urgent: urgentTickets > 0 },
          { label: 'My Tasks', value: upcomingTasks.length, icon: 'CheckSquare', trend: null },
        ]}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTickets tickets={recentTickets} />
        <UpcomingTasks tasks={tasks} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}