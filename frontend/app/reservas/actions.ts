'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';

export async function cancelBookingAction(bookingId: string) {
  const session = await requireRole('customer');

  try {
    await apiFetch(`/bookings/${bookingId}/cancel`, { method: 'POST', token: session.token });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(`/reservas?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  revalidatePath('/reservas');
}
