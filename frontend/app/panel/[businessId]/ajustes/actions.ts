'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import type { Business } from '@/lib/types/api';

export async function updateBusinessAction(businessId: string, formData: FormData) {
  const session = await requireRole('business_owner');
  const depositRaw = formData.get('depositPercentage');

  try {
    await apiFetch<Business>(`/businesses/${businessId}`, {
      method: 'PATCH',
      token: session.token,
      body: {
        name: formData.get('name'),
        address: formData.get('address'),
        city: formData.get('city'),
        description: formData.get('description') || undefined,
        depositPercentage: depositRaw ? Number(depositRaw) : undefined,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(`/panel/${businessId}/ajustes?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  revalidatePath(`/panel/${businessId}`);
  redirect(`/panel/${businessId}/ajustes`);
}

export async function publishBusinessAction(businessId: string) {
  const session = await requireRole('business_owner');

  try {
    await apiFetch<Business>(`/businesses/${businessId}/publish`, {
      method: 'POST',
      token: session.token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(`/panel/${businessId}/ajustes?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  revalidatePath(`/panel/${businessId}`);
  redirect(`/panel/${businessId}/ajustes`);
}
