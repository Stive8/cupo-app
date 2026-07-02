import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlotPicker } from '@/components/booking/slot-picker';
import type { AvailabilitySlot, Business, Service } from '@/lib/types/api';

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  let business: Business;
  try {
    business = await apiFetch<Business>(`/businesses/${businessId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [services, slots] = await Promise.all([
    apiFetch<Service[]>(`/services/business/${businessId}`),
    apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}`),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{business.name}</h1>
        <p className="text-muted-foreground">
          {business.address}, {business.city}
        </p>
        {business.description && <p className="mt-2">{business.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este negocio aún no tiene servicios.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="flex justify-between text-sm">
                <span>
                  {service.name} ({service.durationMinutes} min)
                </span>
                <span className="font-medium">
                  {formatCents(service.priceCents, service.currency)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Elige un horario</CardTitle>
        </CardHeader>
        <CardContent>
          <SlotPicker slots={slots} services={services} businessId={businessId} />
        </CardContent>
      </Card>
    </div>
  );
}
