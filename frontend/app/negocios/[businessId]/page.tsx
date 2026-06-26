import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const servicesById = new Map(services.map((service) => [service.id, service]));

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold">{business.name}</h1>
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
          <CardTitle>Horarios disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay horarios disponibles por ahora.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => {
                const service = servicesById.get(slot.serviceId);
                return (
                  <Link key={slot.id} href={`/reservar/${slot.id}?businessId=${businessId}`}>
                    <Card className="transition-colors hover:border-primary">
                      <CardContent className="space-y-1 pt-4 text-sm">
                        <p className="font-medium">{formatDateTime(slot.startTime)}</p>
                        {service && (
                          <p className="text-muted-foreground">
                            {service.name} — {formatCents(service.priceCents, service.currency)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
