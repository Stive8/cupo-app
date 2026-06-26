'use server';

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import type { Booking } from '@/lib/types/api';

export async function createBookingAction(
  slotId: string,
  businessId: string,
  formData: FormData,
) {
  const session = await requireRole('customer');
  const notes = formData.get('notes');

  let booking: Booking;
  try {
    booking = await apiFetch<Booking>('/bookings', {
      method: 'POST',
      token: session.token,
      body: { slotId, notes: notes || undefined },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(
        `/reservar/${slotId}?businessId=${businessId}&error=${encodeURIComponent(error.message)}`,
      );
    }
    throw error;
  }

  redirect(`/reservas/${booking.id}/pagar`);
}
