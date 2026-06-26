'use server';

import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import type { Business } from '@/lib/types/api';

export async function createBusinessAction(formData: FormData) {
  const session = await requireRole('business_owner');
  const depositRaw = formData.get('depositPercentage');

  let business: Business;
  try {
    business = await apiFetch<Business>('/businesses', {
      method: 'POST',
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
      redirect(`/panel/nuevo?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect(`/panel/${business.id}`);
}
