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
import { Calendar, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const viewOptions = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

export function CalendarFilters({ connectedProviders }: { connectedProviders: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentView = searchParams.get('view') || 'month';

  const handleViewChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', value);
    router.push(`/dashboard/calendar?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={currentView} onValueChange={handleViewChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            {viewOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {connectedProviders.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Connected:</span>
          {connectedProviders.map(provider => (
            <Badge key={provider} variant="secondary" className="gap-1">
              {provider === 'GOOGLE' ? '📅' : '📧'} {provider.charAt(0) + provider.slice(1).toLowerCase()}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

import { Badge } from '@/components/ui/badge';