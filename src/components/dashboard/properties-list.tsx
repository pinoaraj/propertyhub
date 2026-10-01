'use client';

import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Home, Users, MapPin, Plus, Edit, Trash2, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  units: Array<{
    id: string;
    unitNumber: string;
    rentAmount: number | string;
    isOccupied: boolean;
    tenant: { name: string | null; email: string | null } | null;
  }>;
  _count: { units: number };
}

export function PropertiesList({ properties }: { properties: Property[] }) {
  if (!properties.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first property</p>
          <Button asChild>
            <Link href="/dashboard/properties/new">Add Property</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {properties.map(property => {
        const occupiedUnits = property.units.filter(u => u.isOccupied).length;
        const totalUnits = property.units.length;
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

        return (
          <Card key={property.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{property.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}, {property.city}, {property.state} {property.zipCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/properties/${property.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Units</p>
                  <p className="text-2xl font-bold">{totalUnits}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold">{occupiedUnits}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                  <p className={cn('text-2xl font-bold', occupancyRate >= 90 ? 'text-green-600' : occupancyRate >= 70 ? 'text-yellow-600' : 'text-red-600')}>
                    {occupancyRate}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">
                    {property.units.reduce((sum, u) => sum + Number(u.rentAmount), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </p>
                </div>
              </div>

              {/* Units Preview */}
              {property.units.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Units ({property.units.length})
                    </h4>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/properties/${property.id}`}>View all</Link>
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {property.units.slice(0, 4).map(unit => (
                      <div
                        key={unit.id}
                        className={cn(
                          'p-3 rounded-lg border',
                          unit.isOccupied ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Unit {unit.unitNumber}</span>
                          <Badge variant={unit.isOccupied ? 'success' : 'outline'}>
                            {unit.isOccupied ? 'Occupied' : 'Vacant'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {Number(unit.rentAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/mo
                        </p>
                        {unit.tenant && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {unit.tenant.name}
                          </p>
                        )}
                      </div>
                    ))}
                    {property.units.length > 4 && (
                      <div className="p-3 rounded-lg border bg-muted/50 text-center text-sm text-muted-foreground">
                        +{property.units.length - 4} more units
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}