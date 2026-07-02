import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AvailabilitySlot, Booking } from '@/lib/types/api';

function currentTimeMs(): number {
  return Date.now();
}

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const session = await requireRole('business_owner');
  const business = await getOwnedBusinessOrNotFound(session.token, businessId);

  const [bookings, slots] = await Promise.all([
    apiFetch<Booking[]>(`/bookings/business/${businessId}`, { token: session.token }),
    apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}`),
  ]);

  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const revenueCents = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.depositCents, 0);

  const now = currentTimeMs();
  const upcoming = bookings
    .filter((b) => b.status === 'confirmed')
    .map((b) => ({ booking: b, slot: slotsById.get(b.slotId) }))
    .filter(
      (x): x is { booking: Booking; slot: AvailabilitySlot } =>
        x.slot !== undefined && new Date(x.slot.startTime).getTime() > now,
    )
    .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>

      {business.status !== 'active' && (
        <Card className="border-primary/40 bg-accent">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
            <span>Tu negocio todavía no está publicado.</span>
            <Link
              href={`/panel/${businessId}/ajustes`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Publicar en Ajustes →
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">{confirmedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pendientes de pago</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">{pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">{completedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Ingresos por depósitos</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">
            {formatCents(revenueCents)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas reservas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas confirmadas próximas.</p>
          ) : (
            upcoming.map(({ booking, slot }) => (
              <div key={booking.id} className="flex items-center justify-between text-sm">
                <span>{formatDateTime(slot.startTime)}</span>
                <span className="text-muted-foreground">{formatCents(booking.depositCents)}</span>
              </div>
            ))
          )}
          <Link
            href={`/panel/${businessId}/horarios`}
            className="inline-block pt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver agenda →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
