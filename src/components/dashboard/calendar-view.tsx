'use client';

import { useState } from 'react';
import { formatDateTime, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Calendar, CheckCircle, Clock, MapPin, User, AlertTriangle, ChevronLeft, ChevronRight, Sun, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  type: 'ticket' | 'task';
  unit: string;
  property: string;
  assignee?: string;
  priority?: string;
  status?: string;
  provider?: string;
}

export function CalendarView({
  tickets,
  tasks,
  connectedProviders,
}: {
  tickets: any[];
  tasks: any[];
  connectedProviders: string[];
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Transform tickets and tasks to calendar events
  const events: CalendarEvent[] = [
    ...tickets
      .filter(t => t.scheduledAt)
      .map(t => ({
        id: t.id,
        title: t.title,
        start: t.scheduledAt,
        end: new Date(new Date(t.scheduledAt).getTime() + 60 * 60 * 1000),
        type: 'ticket' as const,
        unit: `Unit ${t.unit.unitNumber}`,
        property: t.unit.property.name,
        assignee: t.assignedTo?.name,
        priority: t.priority,
        status: t.status,
        provider: t.calendarProvider,
      })),
    ...tasks
      .filter(t => t.dueDate)
      .map(t => ({
        id: t.id,
        title: t.title,
        start: t.dueDate,
        end: new Date(new Date(t.dueDate).getTime() + 30 * 60 * 1000),
        type: 'task' as const,
        unit: t.ticket ? `Unit ${t.ticket.unit.unitNumber}` : 'N/A',
        property: t.ticket?.unit.property.name || 'N/A',
        assignee: t.assignee?.name,
        status: t.status,
      })),
  ];

  const getEventsForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter(e => {
      const eventStart = new Date(e.start);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const totalCells = Math.ceil((days.length) / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      days.push({ date: new Date(year, month + 1, i - daysInMonth + 1), isCurrentMonth: false });
    }
    return days;
  };

  const monthDays = getMonthDays(currentDate);
  const today = new Date();

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-destructive/20 text-destructive border-destructive/30',
    HIGH: 'bg-destructive/20 text-destructive border-destructive/30',
    NORMAL: 'bg-primary/20 text-primary border-primary/30',
    LOW: 'bg-secondary/20 text-secondary border-secondary/30',
  };

  if (view === 'month') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              <Sun className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {monthDays.map(({ date, isCurrentMonth }) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  'relative min-h-[100px] p-2 border',
                  !isCurrentMonth && 'bg-muted/30',
                  isToday && 'bg-primary/5 border-primary'
                )}
              >
                <div className={cn('text-sm font-medium', isToday && 'text-primary')}>
                  {date.getDate()}
                </div>
                <div className="mt-1 space-y-1 max-h-[70px] overflow-y-auto">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded truncate cursor-pointer hover:opacity-80',
                        priorityColors[event.priority || 'NORMAL']
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {connectedProviders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Connected Calendars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {connectedProviders.map(provider => (
                  <Badge key={provider} variant="secondary" className="gap-1">
                    {provider === 'GOOGLE' ? '📅' : '📧'} {provider.charAt(0) + provider.slice(1).toLowerCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return <div>Week/Day view coming soon</div>;
}