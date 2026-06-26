'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import type { AvailabilitySlot } from '@/lib/types/api';

function redirectWithError(businessId: string, message: string): never {
  redirect(`/panel/${businessId}/horarios?error=${encodeURIComponent(message)}`);
}

export async function createSlotAction(businessId: string, formData: FormData) {
  const session = await requireRole('business_owner');

  try {
    await apiFetch<AvailabilitySlot>('/slots', {
      method: 'POST',
      token: session.token,
      body: {
        businessId,
        serviceId: formData.get('serviceId'),
        startTime: new Date(String(formData.get('startTime'))).toISOString(),
        endTime: new Date(String(formData.get('endTime'))).toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) redirectWithError(businessId, error.message);
    throw error;
  }

  revalidatePath(`/panel/${businessId}/horarios`);
  redirect(`/panel/${businessId}/horarios`);
}

export async function blockSlotAction(businessId: string, slotId: string) {
  const session = await requireRole('business_owner');
  try {
    await apiFetch(`/slots/${slotId}/block`, { method: 'POST', token: session.token });
  } catch (error) {
    if (error instanceof ApiError) redirectWithError(businessId, error.message);
    throw error;
  }
  revalidatePath(`/panel/${businessId}/horarios`);
}

export async function unblockSlotAction(businessId: string, slotId: string) {
  const session = await requireRole('business_owner');
  try {
    await apiFetch(`/slots/${slotId}/unblock`, { method: 'POST', token: session.token });
  } catch (error) {
    if (error instanceof ApiError) redirectWithError(businessId, error.message);
    throw error;
  }
  revalidatePath(`/panel/${businessId}/horarios`);
}

export async function deleteSlotAction(businessId: string, slotId: string) {
  const session = await requireRole('business_owner');
  try {
    await apiFetch(`/slots/${slotId}`, { method: 'DELETE', token: session.token });
  } catch (error) {
    if (error instanceof ApiError) redirectWithError(businessId, error.message);
    throw error;
  }
  revalidatePath(`/panel/${businessId}/horarios`);
}
