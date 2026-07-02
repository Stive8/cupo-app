import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AvailabilitySlot, Service } from '@/lib/types/api';
import { createSlotAction, blockSlotAction, unblockSlotAction, deleteSlotAction } from './actions';

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  booked: 'Reservado',
  blocked: 'Bloqueado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  available: 'default',
  booked: 'secondary',
  blocked: 'outline',
};

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function timeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startIso).toLocaleTimeString('es-CO', opts)} – ${new Date(endIso).toLocaleTimeString('es-CO', opts)}`;
}

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

  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const groups = new Map<string, AvailabilitySlot[]>();
  for (const slot of sorted) {
    const key = dateKey(slot.startTime);
    const arr = groups.get(key) ?? [];
    arr.push(slot);
    groups.set(key, arr);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>Próximos horarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.size === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tienes horarios.</p>
          ) : (
            Array.from(groups.entries()).map(([day, daySlots]) => (
              <div key={day} className="space-y-2">
                <h3 className="font-heading text-sm font-semibold capitalize text-foreground">
                  {dayHeading(daySlots[0].startTime)}
                </h3>
                <div className="space-y-2">
                  {daySlots.map((slot) => {
                    const boundBlock = blockSlotAction.bind(null, businessId, slot.id);
                    const boundUnblock = unblockSlotAction.bind(null, businessId, slot.id);
                    const boundDelete = deleteSlotAction.bind(null, businessId, slot.id);
                    return (
                      <div
                        key={slot.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {timeRange(slot.startTime, slot.endTime)}
                          </span>
                          <Badge variant={STATUS_VARIANT[slot.status]}>
                            {STATUS_LABEL[slot.status]}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
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
