import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Service } from '@/lib/types/api';
import { createServiceAction, deleteServiceAction } from './actions';

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { businessId } = await params;
  const { error } = await searchParams;
  const session = await requireRole('business_owner');
  await getOwnedBusinessOrNotFound(session.token, businessId);
  const services = await apiFetch<Service[]>(`/services/business/${businessId}`);

  const boundCreate = createServiceAction.bind(null, businessId);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Servicios</h1>
      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>Servicios actuales</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tienes servicios.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const boundDelete = deleteServiceAction.bind(null, businessId, service.id);
                  return (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.durationMinutes} min</TableCell>
                      <TableCell>{formatCents(service.priceCents, service.currency)}</TableCell>
                      <TableCell>
                        <form action={boundDelete}>
                          <Button type="submit" variant="ghost" size="sm">
                            Eliminar
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={boundCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Cancha sintética 1 hora" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duración (minutos)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={1}
                defaultValue={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceCop">Precio (COP)</Label>
              <Input
                id="priceCop"
                name="priceCop"
                type="number"
                min={0}
                step="0.01"
                placeholder="50000"
                required
              />
            </div>
            <Button type="submit">Crear servicio</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
