import { requireRole } from '@/lib/server/session';
import { apiFetch } from '@/lib/server/api';
import { FormError } from '@/components/form-error';
import { placeholderListing } from '@/lib/placeholder-listing';
import { TripsTabs, type TripBusiness } from '@/components/booking/trips-tabs';
import type { Booking, Business } from '@/lib/types/api';
import { cancelBookingAction } from './actions';

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await requireRole('customer');
  const bookings = await apiFetch<Booking[]>('/bookings/me', { token: session.token });

  const uniqueBusinessIds = [...new Set(bookings.map((b) => b.businessId))];
  const businessEntries = await Promise.all(
    uniqueBusinessIds.map(async (id, index): Promise<[string, TripBusiness]> => {
      const business = await apiFetch<Business>(`/businesses/${id}`).catch(
        (): Business => ({
          id,
          ownerId: '',
          name: 'Negocio',
          vertical: 'sports_field',
          description: null,
          address: '',
          city: '',
          lat: null,
          lng: null,
          metadata: null,
          status: 'active',
          depositPercentage: 0,
          createdAt: '',
          deletedAt: null,
        }),
      );
      const placeholder = placeholderListing(id, index);
      return [
        id,
        {
          name: business.name,
          city: business.city,
          photo: placeholder.photo,
          categoryLabel: placeholder.categoryLabel,
        },
      ];
    }),
  );
  const businesses = Object.fromEntries(businessEntries);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-7">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Mis reservas
      </h1>
      <p className="mb-6 mt-1.5 text-[15px] text-muted-foreground">
        Gestiona tus próximas citas y revisa tu historial.
      </p>
      <FormError message={error} />
      <TripsTabs bookings={bookings} businesses={businesses} cancelBookingAction={cancelBookingAction} />
    </div>
  );
}
