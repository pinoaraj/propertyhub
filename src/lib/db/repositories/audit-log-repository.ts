import { prisma } from '@/lib/prisma/client';

export interface CreateAuditLogEntryInput {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLogEntry(input: CreateAuditLogEntryInput) {
  return prisma.auditLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as any,
    },
  });
}

export async function findAuditLogs({
  entityType,
  entityId,
  actor,
  action,
  limit = 100,
  offset = 0,
}: {
  entityType?: string;
  entityId?: string;
  actor?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (actor) where.actor = actor;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}