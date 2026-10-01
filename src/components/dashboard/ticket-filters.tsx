'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LOW', label: 'Low' },
];

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('status', value);
    else params.delete('status');
    params.delete('page');
    router.push(`/dashboard/tickets?${params.toString()}`);
  };

  const handlePriorityChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('priority', value);
    else params.delete('priority');
    params.delete('page');
    router.push(`/dashboard/tickets?${params.toString()}`);
  };

  const hasFilters = currentStatus || currentPriority;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Select value={currentPriority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('status');
            params.delete('priority');
            params.delete('page');
            router.push(`/dashboard/tickets?${params.toString()}`);
          }}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}