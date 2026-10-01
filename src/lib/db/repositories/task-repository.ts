import { prisma } from '@/lib/prisma/client';
import type { Task, TaskStatus } from '@/types';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate: Date;
  assigneeId: string;
  ticketId?: string;
  calendarEventId?: string;
  calendarProvider?: 'GOOGLE' | 'MICROSOFT';
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date;
  completedAt?: Date | null;
  assigneeId?: string;
  ticketId?: string | null;
  calendarEventId?: string | null;
  calendarProvider?: 'GOOGLE' | 'MICROSOFT' | null;
}

export async function createTask(input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      ticketId: input.ticketId,
      calendarEventId: input.calendarEventId,
      calendarProvider: input.calendarProvider,
    },
    include: {
      assignee: true,
      ticket: { include: { unit: { include: { property: true } } } },
    },
  });
}

export async function findTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      ticket: { include: { unit: { include: { property: true } } } },
    },
  });
}

export async function findTasks({
  assigneeId,
  status,
  dueDateFrom,
  dueDateTo,
  limit = 50,
  offset = 0,
}: {
  assigneeId?: string;
  status?: TaskStatus;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = status;
  if (dueDateFrom || dueDateTo) {
    where.dueDate = {};
    if (dueDateFrom) where.dueDate.gte = dueDateFrom;
    if (dueDateTo) where.dueDate.lte = dueDateTo;
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        ticket: { include: { unit: { include: { property: true } } } },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  return prisma.task.update({
    where: { id },
    data: input,
    include: {
      assignee: true,
      ticket: { include: { unit: { include: { property: true } } } },
    },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({ where: { id } });
}

export async function markTaskComplete(id: string, completedAt = new Date()) {
  return prisma.task.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt },
  });
}