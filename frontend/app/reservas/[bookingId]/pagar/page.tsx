import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WompiCheckoutButton } from '@/components/booking/wompi-checkout-button';
import type { InitiatePaymentResult } from '@/lib/types/api';

export default async function PayBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireRole('customer');

  let payment: InitiatePaymentResult;
  try {
    payment = await apiFetch<InitiatePaymentResult>('/payments', {
      method: 'POST',
      token: session.token,
      body: { bookingId },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Esta reserva ya está pagada</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Puedes ver el estado en{' '}
              <Link href={`/reservas/${bookingId}/estado`} className="underline">
                el estado de tu reserva
              </Link>
              .
            </CardContent>
          </Card>
        </div>
      );
    }
    throw error;
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Pagar depósito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Depósito a pagar:{' '}
            <span className="font-medium">{formatCents(payment.amountCents, payment.currency)}</span>
          </p>
          {payment.publicKey ? (
            <WompiCheckoutButton
              publicKey={payment.publicKey}
              currency={payment.currency}
              amountInCents={payment.amountCents}
              reference={payment.reference}
              integritySignature={payment.integritySignature}
              redirectUrl={`${appUrl}/reservas/${bookingId}/estado`}
            />
          ) : (
            <p className="text-sm text-amber-600">
              El negocio todavía no ha activado los pagos con Wompi (falta configurar
              WOMPI_PUBLIC_KEY en el backend).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
