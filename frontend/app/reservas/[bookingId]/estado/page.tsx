import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Payment, PaymentStatus } from '@/lib/types/api';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Esperando confirmación del pago...',
  approved: '¡Reserva confirmada!',
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
  const approved = status === 'approved';

  if (approved) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 text-center">
        <div className="relative mx-auto mb-6 h-24 w-24">
          <span className="absolute inset-0 animate-[pulse-ring_1.6s_ease-out_infinite] rounded-full bg-primary opacity-20" />
          <div className="relative flex h-24 w-24 animate-[pop-in_.55s_cubic-bezier(.22,1,.36,1)_both] items-center justify-center rounded-full bg-primary shadow-lg">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">¡Reserva confirmada!</h1>
        <p className="mx-auto mt-2.5 mb-7 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Puedes gestionarla cuando quieras desde <b className="text-foreground">Mis reservas</b>.
        </p>
        <Card className="mb-6 text-left">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Depósito pagado: {formatCents(payment!.amountCents, payment!.currency)}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button render={<Link href="/reservas">Ver mis reservas</Link>} nativeButton={false} className="flex-1" />
          <Button
            render={<Link href="/">Explorar más</Link>}
            nativeButton={false}
            variant="outline"
            className="flex-1"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {status === 'pending' && <meta httpEquiv="refresh" content="3" />}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{STATUS_LABEL[status]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
