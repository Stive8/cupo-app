import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Payment, PaymentStatus } from '@/lib/types/api';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Esperando confirmación del pago...',
  approved: '¡Pago aprobado! Tu reserva está confirmada.',
  rejected: 'El pago fue rechazado. Tu reserva fue cancelada.',
  refunded: 'El pago fue reembolsado.',
};

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireRole('customer');

  let payment: Payment | null = null;
  try {
    payment = await apiFetch<Payment>(`/payments/booking/${bookingId}`, { token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }

  const status = payment?.status ?? 'pending';

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {status === 'pending' && <meta httpEquiv="refresh" content="3" />}
      <Card>
        <CardHeader>
          <CardTitle>Estado de tu reserva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{STATUS_LABEL[status]}</p>
          {payment && (
            <p className="text-sm text-muted-foreground">
              Depósito: {formatCents(payment.amountCents, payment.currency)}
            </p>
          )}
          <Link href="/reservas" className="text-sm underline">
            Ver mis reservas
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
