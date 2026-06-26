import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { apiFetch } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { FormError } from '@/components/form-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Booking } from '@/lib/types/api';
import { cancelBookingAction } from './actions';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await requireRole('customer');
  const bookings = await apiFetch<Booking[]>('/bookings/me', { token: session.token });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Mis reservas</h1>
      <FormError message={error} />

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no tienes reservas.{' '}
          <Link href="/" className="underline">
            Busca una cancha
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const boundCancel = cancelBookingAction.bind(null, booking.id);
            const cancellable = booking.status === 'pending' || booking.status === 'confirmed';
            return (
              <Card key={booking.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div className="space-y-1 text-sm">
                    <Badge variant="secondary">{STATUS_LABEL[booking.status]}</Badge>
                    <p>Depósito: {formatCents(booking.depositCents)}</p>
                    <p className="text-muted-foreground">
                      Creada: {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <Button
                        render={<Link href={`/reservas/${booking.id}/pagar`}>Pagar</Link>}
                        size="sm"
                      />
                    )}
                    {cancellable && (
                      <form action={boundCancel}>
                        <Button type="submit" variant="outline" size="sm">
                          Cancelar
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
