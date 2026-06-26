import 'server-only';
import { notFound } from 'next/navigation';
import { apiFetch } from './api';
import type { Business } from '../types/api';

export function listOwnedBusinesses(token: string): Promise<Business[]> {
  return apiFetch<Business[]>('/businesses/me', { token });
}

export async function getOwnedBusinessOrNotFound(
  token: string,
  businessId: string,
): Promise<Business> {
  const businesses = await listOwnedBusinesses(token);
  const business = businesses.find((b) => b.id === businessId);
  if (!business) notFound();
  return business;
}
