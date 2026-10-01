import { DefaultSession } from 'next-auth';
import type { DefaultUser } from '@auth/core/types';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  }
}

export type UserRole = 'ADMIN' | 'PROPERTY_MANAGER' | 'TENANT' | 'SERVICE_TECH';

export type TicketStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'URGENT';
export type TicketCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'STRUCTURAL'
  | 'HVAC'
  | 'APPLIANCE'
  | 'SECURITY'
  | 'CLEANING'
  | 'PAINTING'
  | 'LOCKSMITH'
  | 'GENERAL';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type CalendarProvider = 'GOOGLE' | 'MICROSOFT';

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  htmlLink?: string;
  provider: CalendarProvider;
}

export interface DailyAgenda {
  date: Date;
  calendarEvents: CalendarEvent[];
  tasks: Task[];
  maintenanceTickets: MaintenanceTicket[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date;
  assigneeId: string;
  ticketId?: string;
  calendarEventId?: string;
  calendarProvider?: CalendarProvider;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  unitId: string;
  unitNumber?: string;
  propertyName?: string;
  reportedById: string;
  assignedToId?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledAt?: Date;
  startedAt?: Date;
  resolvedAt?: Date;
  calendarEventId?: string;
  calendarProvider?: CalendarProvider;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  userId: string;
  ticketId?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  createdAt: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description?: string;
  managerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
  tenantId?: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number;
  rentAmount: number;
  depositAmount?: number;
  leaseStart?: Date;
  leaseEnd?: Date;
  isOccupied: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: CalendarProvider;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
  scopes: string[];
  isActive: boolean;
  lastSyncAt?: Date;
}