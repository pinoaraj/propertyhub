import { prisma } from '@/lib/prisma/client';
import type { UserRole } from '@/types';

export interface CreateUserInput {
  email: string;
  name?: string;
  password?: string;
  role?: UserRole;
  image?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  image?: string;
  emailVerified?: Date;
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: input.password,
      role: input.role || 'TENANT',
      image: input.image,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      connectedAccounts: true,
      properties: true,
      units: true,
      assignedTickets: true,
      createdTickets: true,
      tasks: true,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { connectedAccounts: true },
  });
}

export async function findUsers({
  role,
  isActive,
  limit = 50,
  offset = 0,
}: {
  role?: UserRole;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        connectedAccounts: true,
        _count: { select: { properties: true, units: true, assignedTickets: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data: input,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export async function updateUserRole(id: string, role: UserRole) {
  return prisma.user.update({
    where: { id },
    data: { role },
  });
}

export async function findUsersByPropertyManager(managerId: string) {
  return prisma.user.findMany({
    where: {
      OR: [
        { units: { some: { property: { managerId } } } },
        { assignedTickets: { some: { unit: { property: { managerId } } } } },
      ],
    },
    include: {
      units: { include: { property: true } },
      assignedTickets: { include: { unit: { include: { property: true } } } },
    },
  });
}