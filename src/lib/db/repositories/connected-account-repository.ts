import { prisma } from '@/lib/prisma/client';
import type { CalendarProvider } from '@/types';

export interface CreateConnectedAccountInput {
  userId: string;
  provider: CalendarProvider;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  calendarId?: string;
  scopes?: string[];
}

export interface UpdateConnectedAccountInput {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date | null;
  calendarId?: string;
  scopes?: string[];
  isActive?: boolean;
  lastSyncAt?: Date;
}

export async function createConnectedAccount(input: CreateConnectedAccountInput) {
  return prisma.connectedAccount.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
      calendarId: input.calendarId,
      scopes: input.scopes || [],
      isActive: true,
    },
  });
}

export async function findConnectedAccount(userId: string, provider: CalendarProvider) {
  return prisma.connectedAccount.findUnique({
    where: { userId_provider: { userId, provider } },
  });
}

export async function findConnectedAccounts(userId: string) {
  return prisma.connectedAccount.findMany({
    where: { userId, isActive: true },
  });
}

export async function updateConnectedAccount(
  userId: string,
  provider: CalendarProvider,
  input: UpdateConnectedAccountInput
) {
  return prisma.connectedAccount.update({
    where: { userId_provider: { userId, provider } },
    data: input,
  });
}

export async function deleteConnectedAccount(userId: string, provider: CalendarProvider) {
  return prisma.connectedAccount.update({
    where: { userId_provider: { userId, provider } },
    data: { isActive: false },
  });
}

export async function upsertConnectedAccount(
  userId: string,
  provider: CalendarProvider,
  input: CreateConnectedAccountInput
) {
  return prisma.connectedAccount.upsert({
    where: { userId_provider: { userId, provider } },
    update: {
      providerAccountId: input.providerAccountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
      calendarId: input.calendarId,
      scopes: input.scopes,
      isActive: true,
      lastSyncAt: new Date(),
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiry: input.tokenExpiry,
      calendarId: input.calendarId,
      scopes: input.scopes || [],
      isActive: true,
      lastSyncAt: new Date(),
    },
  });
}