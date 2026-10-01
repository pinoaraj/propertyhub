'use client';

import { formatDateTime, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, Calendar, Check } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueDate: Date | string;
  completedAt?: Date | string | null;
  ticket?: {
    id: string;
    title: string;
    unit: { unitNumber: string };
  } | null;
}

export function UpcomingTasks({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No upcoming tasks</p>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tasks.map((task) => {
            const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'PENDING';
            return (
              <div
                key={task.id}
                className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-full',
                    task.status === 'COMPLETED' ? 'text-green-600' : isOverdue ? 'text-destructive' : 'text-muted-foreground'
                  )}
                  onClick={(e) => e.preventDefault()}
                  disabled={task.status === 'COMPLETED'}
                  aria-label={task.status === 'COMPLETED' ? 'Task completed' : 'Mark as complete'}
                >
                  {task.status === 'COMPLETED' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn('font-medium truncate', task.status === 'COMPLETED' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </h4>
                    {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                    {task.status === 'COMPLETED' && <Badge variant="success">Done</Badge>}
                  </div>
                  {task.ticket && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      Related to: {task.ticket.title} (Unit {task.ticket.unit.unitNumber})
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {formatDateTime(task.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t">
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard/tasks">View all tasks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { cn } from '@/lib/utils';