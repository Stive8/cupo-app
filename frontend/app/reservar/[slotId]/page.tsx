import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AvailabilitySlot, Service } from '@/lib/types/api';
import { createBookingAction } from './actions';

export default async function ConfirmBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ businessId?: string; error?: string }>;
}) {
  const { slotId } = await params;
  const { businessId, error } = await searchParams;
  if (!businessId) notFound();

  const slots = await apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}`);
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) notFound();

  const services = await apiFetch<Service[]>(`/services/business/${businessId}`);
  const service = services.find((s) => s.id === slot.serviceId);

  const boundCreate = createBookingAction.bind(null, slotId, businessId);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Confirmar reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={error} />
          <div className="text-sm">
            <p className="font-medium">{formatDateTime(slot.startTime)}</p>
            {service && (
              <p className="text-muted-foreground">
                {service.name} — {formatCents(service.priceCents, service.currency)}
              </p>
            )}
          </div>
          <form action={boundCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea id="notes" name="notes" placeholder="Ej. Necesito balones" />
            </div>
            <Button type="submit" className="w-full">
              Confirmar y reservar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
