'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import type { Service } from '@/lib/types/api';

function redirectWithError(businessId: string, message: string): never {
  redirect(`/panel/${businessId}/servicios?error=${encodeURIComponent(message)}`);
}

export async function createServiceAction(businessId: string, formData: FormData) {
  const session = await requireRole('business_owner');
  const priceCop = Number(formData.get('priceCop'));

  try {
    await apiFetch<Service>('/services', {
      method: 'POST',
      token: session.token,
      body: {
        businessId,
        name: formData.get('name'),
        durationMinutes: Number(formData.get('durationMinutes')),
        priceCents: Math.round(priceCop * 100),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) redirectWithError(businessId, error.message);
    throw error;
  }

  revalidatePath(`/panel/${businessId}/servicios`);
  redirect(`/panel/${businessId}/servicios`);
}

export async function deleteServiceAction(businessId: string, serviceId: string) {
  const session = await requireRole('business_owner');

  try {
    await apiFetch(`/services/${serviceId}`, { method: 'DELETE', token: session.token });
  } catch (error) {
    if (error instanceof ApiError) redirectWithError(businessId, error.message);
    throw error;
  }

  revalidatePath(`/panel/${businessId}/servicios`);
}
