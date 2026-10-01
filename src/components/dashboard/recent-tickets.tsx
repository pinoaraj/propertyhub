'use client';

import { formatDateTime, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date | string;
  unit: {
    unitNumber: string;
    property: { name: string };
  };
  assignedTo?: { name: string | null; email: string | null } | null;
}

const priorityColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  URGENT: 'destructive',
  HIGH: 'destructive',
  NORMAL: 'default',
  LOW: 'secondary',
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  PENDING: 'outline',
  ASSIGNED: 'secondary',
  IN_PROGRESS: 'default',
  RESOLVED: 'success',
  CLOSED: 'secondary',
};

const categoryIcons: Record<string, React.ReactNode> = {
  PLUMBING: <Wrench className="h-3 w-3" />,
  ELECTRICAL: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  STRUCTURAL: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>,
  HVAC: <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  DEFAULT: <Wrench className="h-3 w-3" />,
};

export function RecentTickets({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Recent Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No tickets yet</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/tickets/new">Create your first ticket</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Recent Tickets
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/tickets">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.id}`}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                {categoryIcons[ticket.category] || categoryIcons.DEFAULT}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{ticket.title}</h4>
                  <Badge variant={priorityColors[ticket.priority] || 'default'}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant={statusColors[ticket.status] || 'default'}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {ticket.unit.property.name} - Unit {ticket.unit.unitNumber}
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(ticket.createdAt)}
                  </span>
                  {ticket.assignedTo && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {ticket.assignedTo.name || ticket.assignedTo.email}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}