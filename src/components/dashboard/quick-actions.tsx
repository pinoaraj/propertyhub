'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench, Home, CalendarPlus, Users, FileText } from 'lucide-react';
import Link from 'next/link';

const actions = [
  {
    name: 'New Ticket',
    description: 'Report a maintenance issue',
    href: '/dashboard/tickets/new',
    icon: Wrench,
    color: 'bg-blue-500',
  },
  {
    name: 'Add Property',
    description: 'Register a new property',
    href: '/dashboard/properties/new',
    icon: Home,
    color: 'bg-green-500',
  },
  {
    name: 'Schedule Visit',
    description: 'Book a maintenance visit',
    href: '/dashboard/calendar/new',
    icon: CalendarPlus,
    color: 'bg-purple-500',
  },
  {
    name: 'Add Unit',
    description: 'Create a new rental unit',
    href: '/dashboard/units/new',
    icon: Plus,
    color: 'bg-orange-500',
  },
  {
    name: 'Invite Team',
    description: 'Add team members',
    href: '/dashboard/team/invite',
    icon: Users,
    color: 'bg-pink-500',
  },
  {
    name: 'Generate Report',
    description: 'Create maintenance report',
    href: '/dashboard/reports/new',
    icon: FileText,
    color: 'bg-indigo-500',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Button
              key={action.name}
              asChild
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 w-full hover:bg-accent/50"
            >
              <Link href={action.href}>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{action.name}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}