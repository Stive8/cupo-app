import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { formatDateTime } from '@/lib/format';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AvailabilitySlot, Service } from '@/lib/types/api';
import { createSlotAction, blockSlotAction, unblockSlotAction, deleteSlotAction } from './actions';

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  booked: 'Reservado',
  blocked: 'Bloqueado',
};

export default async function SlotsPage({
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

  const [slots, services] = await Promise.all([
    apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}/manage`, { token: session.token }),
    apiFetch<Service[]>(`/services/business/${businessId}`),
  ]);

  const boundCreate = createSlotAction.bind(null, businessId);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Horarios</h1>
      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>Horarios actuales</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tienes horarios.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => {
                  const boundBlock = blockSlotAction.bind(null, businessId, slot.id);
                  const boundUnblock = unblockSlotAction.bind(null, businessId, slot.id);
                  const boundDelete = deleteSlotAction.bind(null, businessId, slot.id);
                  return (
                    <TableRow key={slot.id}>
                      <TableCell>{formatDateTime(slot.startTime)}</TableCell>
                      <TableCell>{formatDateTime(slot.endTime)}</TableCell>
                      <TableCell>
                        <Badge variant={slot.status === 'available' ? 'default' : 'secondary'}>
                          {STATUS_LABEL[slot.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {slot.status === 'available' && (
                          <>
                            <form action={boundBlock}>
                              <Button type="submit" variant="outline" size="sm">
                                Bloquear
                              </Button>
                            </form>
                            <form action={boundDelete}>
                              <Button type="submit" variant="ghost" size="sm">
                                Eliminar
                              </Button>
                            </form>
                          </>
                        )}
                        {slot.status === 'blocked' && (
                          <form action={boundUnblock}>
                            <Button type="submit" variant="outline" size="sm">
                              Desbloquear
                            </Button>
                          </form>
                        )}
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
          <CardTitle>Crear horario</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crea primero un servicio para poder agregar horarios.
            </p>
          ) : (
            <form action={boundCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceId">Servicio</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Inicio</Label>
                <Input id="startTime" name="startTime" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Fin</Label>
                <Input id="endTime" name="endTime" type="datetime-local" required />
              </div>
              <Button type="submit">Crear horario</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
