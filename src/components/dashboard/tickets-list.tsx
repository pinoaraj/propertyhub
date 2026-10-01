'use client';

import { formatDate, formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, AlertTriangle, Clock, CheckCircle, XCircle, Loader2, Calendar, MapPin, User, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date | string;
  scheduledAt?: Date | string | null;
  unit: {
    unitNumber: string;
    property: { name: string };
  };
  assignedTo?: { name: string | null; email: string | null } | null;
  reportedBy?: { name: string | null; email: string | null };
  calendarEventId?: string | null;
  calendarProvider?: string | null;
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

export function TicketsList({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No tickets found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first maintenance ticket</p>
          <Button asChild>
            <Link href="/dashboard/tickets/new">Create Ticket</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Maintenance Tickets ({tickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.id}`}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group"
            >
              <div className={cn(
                'flex-shrink-0 p-2 rounded-lg',
                ticket.priority === 'URGENT' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              )}>
                {categoryIcons[ticket.category] || categoryIcons.DEFAULT}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium truncate">{ticket.title}</h4>
                  <Badge variant={priorityColors[ticket.priority] || 'default'}>
                    {ticket.priority}
                  </Badge>
                  <Badge variant={statusColors[ticket.status] || 'default'}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {ticket.unit.property.name} - Unit {ticket.unit.unitNumber}
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created: {formatDate(ticket.createdAt)}
                  </span>
                  {ticket.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Scheduled: {formatDateTime(ticket.scheduledAt)}
                    </span>
                  )}
                  {ticket.assignedTo && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.assignedTo.name || ticket.assignedTo.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {ticket.calendarEventId && ticket.calendarProvider && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <a
                      href={`https://calendar.google.com/calendar/event?eid=${ticket.calendarEventId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}