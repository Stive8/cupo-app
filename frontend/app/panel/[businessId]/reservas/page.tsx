import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { Booking } from '@/lib/types/api';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

export default async function BusinessBookingsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const session = await requireRole('business_owner');
  await getOwnedBusinessOrNotFound(session.token, businessId);
  const bookings = await apiFetch<Booking[]>(`/bookings/business/${businessId}`, {
    token: session.token,
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Reservas</h1>
      <Card>
        <CardContent className="pt-6">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tienes reservas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creada</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{formatDateTime(booking.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{STATUS_LABEL[booking.status]}</Badge>
                    </TableCell>
                    <TableCell>{formatCents(booking.depositCents)}</TableCell>
                    <TableCell>{formatCents(booking.totalCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
