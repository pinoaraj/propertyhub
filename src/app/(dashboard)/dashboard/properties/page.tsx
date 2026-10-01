import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma/client';
import { PropertiesList } from '@/components/dashboard/properties-list';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';
import Link from 'next/link';

export default async function PropertiesPage() {
  const session = await auth();

  if (!session) {
    return null;
  }

  const properties = await prisma.property.findMany({
    where: { managerId: session.user.id, isActive: true },
    include: {
      units: { where: { isActive: true }, include: { tenant: true } },
      _count: { select: { units: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your properties and units</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Link>
        </Button>
      </div>

      <PropertiesList properties={properties} />
    </div>
  );
}