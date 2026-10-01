import { prisma } from '@/lib/prisma/client';
import type { Property, Unit } from '@/types';

export interface CreatePropertyInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  description?: string;
  managerId: string;
}

export interface UpdatePropertyInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  description?: string;
  isActive?: boolean;
  managerId?: string;
}

export async function createProperty(input: CreatePropertyInput) {
  return prisma.property.create({
    data: {
      name: input.name,
      address: input.address,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      country: input.country || 'US',
      description: input.description,
      managerId: input.managerId,
    },
  });
}

export async function findPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      units: { include: { tenant: true } },
      manager: true,
    },
  });
}

export async function findProperties({
  managerId,
  isActive = true,
  limit = 50,
  offset = 0,
}: {
  managerId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = { isActive };
  if (managerId) where.managerId = managerId;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        units: { where: { isActive: true }, include: { tenant: true } },
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { units: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, total };
}

export async function updateProperty(id: string, input: UpdatePropertyInput) {
  return prisma.property.update({
    where: { id },
    data: input,
    include: { units: true, manager: true },
  });
}

export async function deleteProperty(id: string) {
  return prisma.property.update({
    where: { id },
    data: { isActive: false },
  });
}

export interface CreateUnitInput {
  unitNumber: string;
  propertyId: string;
  tenantId?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  rentAmount: number;
  depositAmount?: number;
  leaseStart?: Date;
  leaseEnd?: Date;
}

export interface UpdateUnitInput {
  unitNumber?: string;
  tenantId?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  rentAmount?: number;
  depositAmount?: number;
  leaseStart?: Date | null;
  leaseEnd?: Date | null;
  isOccupied?: boolean;
  isActive?: boolean;
}

export async function createUnit(input: CreateUnitInput) {
  return prisma.unit.create({
    data: {
      unitNumber: input.unitNumber,
      propertyId: input.propertyId,
      tenantId: input.tenantId,
      bedrooms: input.bedrooms || 1,
      bathrooms: input.bathrooms || 1,
      areaSqFt: input.areaSqFt,
      rentAmount: input.rentAmount,
      depositAmount: input.depositAmount,
      leaseStart: input.leaseStart,
      leaseEnd: input.leaseEnd,
      isOccupied: !!input.tenantId,
    },
    include: { property: true, tenant: true },
  });
}

export async function findUnitById(id: string) {
  return prisma.unit.findUnique({
    where: { id },
    include: { property: true, tenant: true, tickets: true },
  });
}

export async function findUnits({
  propertyId,
  tenantId,
  isActive = true,
  isOccupied,
  limit = 100,
  offset = 0,
}: {
  propertyId?: string;
  tenantId?: string;
  isActive?: boolean;
  isOccupied?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = { isActive };
  if (propertyId) where.propertyId = propertyId;
  if (tenantId) where.tenantId = tenantId;
  if (isOccupied !== undefined) where.isOccupied = isOccupied;

  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: { property: true, tenant: true },
      orderBy: { unitNumber: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.unit.count({ where }),
  ]);

  return { units, total };
}

export async function updateUnit(id: string, input: UpdateUnitInput) {
  return prisma.unit.update({
    where: { id },
    data: input,
    include: { property: true, tenant: true },
  });
}

export async function deleteUnit(id: string) {
  return prisma.unit.update({
    where: { id },
    data: { isActive: false },
  });
}