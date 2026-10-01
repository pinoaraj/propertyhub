'use client';

import { useState } from 'react';
import { formatDateTime, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, AlertTriangle, Clock, CheckCircle, XCircle, Calendar, MapPin, User, Edit, Trash2, ExternalLink, Loader2, Save, MessageSquare, DollarSign, Building2, Home, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  calendarEventId: string | null;
  calendarProvider: string | null;
  unit: {
    unitNumber: string;
    property: { name: string };
    tenant: { id: string; name: string | null; email: string } | null;
  };
  reportedBy: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  events: Array<{
    id: string;
    type: string;
    description: string;
    metadata: any;
    createdAt: string;
    createdById: string | null;
  }>;
}

interface TicketDetailClientProps {
  initialTicket: Ticket;
  currentUserId: string;
  currentUserRole: string;
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

const categories = [
  'PLUMBING', 'ELECTRICAL', 'STRUCTURAL', 'HVAC',
  'APPLIANCE', 'SECURITY', 'CLEANING', 'PAINTING', 'LOCKSMITH', 'GENERAL'
];

const priorities = ['URGENT', 'NORMAL', 'LOW'];
const statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function TicketDetailClient({ initialTicket, currentUserId, currentUserRole }: TicketDetailClientProps) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: initialTicket.title,
    description: initialTicket.description,
    category: initialTicket.category,
    priority: initialTicket.priority,
    status: initialTicket.status,
    estimatedCost: initialTicket.estimatedCost || '',
    assignedToId: initialTicket.assignedTo?.id || '',
  });

  const canEdit = currentUserRole === 'ADMIN' || currentUserRole === 'PROPERTY_MANAGER';
  const canAssign = canEdit;
  const canUpdateStatus = currentUserRole !== 'TENANT' || ticket.reportedBy.id === currentUserId;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          priority: editForm.priority,
          status: editForm.status,
          estimatedCost: editForm.estimatedCost ? parseFloat(editForm.estimatedCost) : null,
          assignedToId: editForm.assignedToId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      const updated = await response.json();
      setTicket(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const updated = await response.json();
      setTicket(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    }
  };

  const formatCost = (cost: string | null) => {
    if (!cost) return '\u2014';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(cost));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{ticket.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={priorityColors[ticket.priority] || 'default'} className="text-sm">
                  {ticket.priority}
                </Badge>
                <Badge variant={statusColors[ticket.status] || 'default'} className="text-sm">
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">{ticket.unit.property.name} - Unit {ticket.unit.unitNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {ticket.calendarEventId && ticket.calendarProvider && (
            <Button variant="outline" asChild>
              <a
                href={`https://calendar.google.com/calendar/event?eid=${ticket.calendarEventId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Calendar Event
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[120px]"
                  placeholder="Describe the issue..."
                />
              ) : (
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{ticket.unit.property.name}</p>
                <p className="text-sm text-muted-foreground">Unit {ticket.unit.unitNumber}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-4 w-4" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select value={editForm.category} onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="capitalize">{ticket.category.toLowerCase().replace('_', ' ')}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Estimated Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.estimatedCost}
                    onChange={(e) => setEditForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    placeholder="0.00"
                  />
                ) : (
                  <p>{formatCost(ticket.estimatedCost)}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Actual Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{formatCost(ticket.actualCost)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem
                  label="Created"
                  date={ticket.createdAt}
                  icon={<Wrench className="h-4 w-4 text-primary" />}
                  description={`Reported by ${ticket.reportedBy.name || ticket.reportedBy.email}`}
                />
                {ticket.scheduledAt && (
                  <TimelineItem
                    label="Scheduled"
                    date={ticket.scheduledAt}
                    icon={<Calendar className="h-4 w-4 text-blue-600" />}
                    description="Maintenance visit scheduled"
                  />
                )}
                {ticket.startedAt && (
                  <TimelineItem
                    label="Started"
                    date={ticket.startedAt}
                    icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    description="Work in progress"
                  />
                )}
                {ticket.resolvedAt && (
                  <TimelineItem
                    label="Resolved"
                    date={ticket.resolvedAt}
                    icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                    description="Issue resolved"
                  />
                )}
                {ticket.status === 'CLOSED' && (
                  <TimelineItem
                    label="Closed"
                    date={ticket.updatedAt}
                    icon={<XCircle className="h-4 w-4 text-gray-600" />}
                    description="Ticket closed"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {ticket.events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.events.map((event) => (
                    <div key={event.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Assignee
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && canAssign ? (
                <Select value={editForm.assignedToId} onValueChange={(v) => setEditForm(prev => ({ ...prev, assignedToId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              ) : ticket.assignedTo ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {ticket.assignedTo.name?.[0] || ticket.assignedTo.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{ticket.assignedTo.name || 'Technician'}</p>
                    <p className="text-sm text-muted-foreground">{ticket.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>

          {ticket.unit.tenant && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Tenant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                    {ticket.unit.tenant.name?.[0] || ticket.unit.tenant.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{ticket.unit.tenant.name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.unit.tenant.email}</p>
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canUpdateStatus && (
                <>
                  {ticket.status === 'PENDING' && (
                    <Button className="w-full justify-start" onClick={() => handleStatusChange('ASSIGNED')}>
                      <User className="h-4 w-4 mr-2" />
                      Assign
                    </Button>
                  )}
                  {ticket.status === 'ASSIGNED' && (
                    <Button className="w-full justify-start" onClick={() => handleStatusChange('IN_PROGRESS')}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Start Work
                    </Button>
                  )}
                  {ticket.status === 'IN_PROGRESS' && (
                    <Button className="w-full justify-start" onClick={() => handleStatusChange('RESOLVED')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                  {['RESOLVED', 'ASSIGNED'].includes(ticket.status) && (
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleStatusChange('CLOSED')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Ticket
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estimated Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.estimatedCost}
                  onChange={(e) => setEditForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimelineItem({ label, date, icon, description }: {
  label: string;
  date: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">{formatDateTime(date)}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}