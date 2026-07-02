import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { placeholderListing } from '@/lib/placeholder-listing';
import { SlotPicker } from '@/components/booking/slot-picker';
import type { AvailabilitySlot, Business, Service } from '@/lib/types/api';

const GALLERY = [
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=80',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=900&q=80',
  'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=900&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900&q=80',
];

// Fixed placeholder reviews — literal copy from the imported mockup. No reviews
// backend exists yet (out of MVP scope), shown here purely for design fidelity.
const REVIEWS = [
  {
    name: 'Andrea M.',
    date: 'hace 3 días',
    rating: 5,
    text: 'Experiencia impecable de principio a fin. Reservar tomó segundos y el lugar superó las expectativas.',
    color: '#3C6E51',
  },
  {
    name: 'Julián R.',
    date: 'hace 1 semana',
    rating: 5,
    text: 'Muy puntuales y profesionales. La confirmación llegó al instante, todo súper claro.',
    color: '#C0552C',
  },
  {
    name: 'Paola V.',
    date: 'hace 2 semanas',
    rating: 4,
    text: 'Excelente atención y ambiente. Volveré sin duda, fue muy fácil agendar.',
    color: '#3D54E6',
  },
  {
    name: 'Diego T.',
    date: 'hace 3 semanas',
    rating: 5,
    text: 'La mejor relación calidad-precio de la zona. Recomendado al 100%.',
    color: '#8a5a2b',
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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

  const placeholder = placeholderListing(businessId, 0);
  const ownerInitials = initials(business.name);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver a resultados
      </Link>

      {/* gallery */}
      <div className="mb-7 grid h-[380px] grid-cols-4 grid-rows-2 gap-2.5 overflow-hidden rounded-3xl">
        {/* eslint-disable @next/next/no-img-element */}
        <img src={GALLERY[0]} alt={business.name} className="row-span-2 h-full w-full object-cover" />
        <img src={GALLERY[1]} alt="" className="h-full w-full object-cover" />
        <img src={GALLERY[2]} alt="" className="h-full w-full object-cover" />
        <img src={GALLERY[3]} alt="" className="h-full w-full object-cover" />
        <div className="relative">
          <img src={GALLERY[4]} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
            +12 fotos
          </div>
        </div>
        {/* eslint-enable @next/next/no-img-element */}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="mb-1.5 text-sm font-semibold text-primary">{placeholder.categoryLabel}</div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {business.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--primary)">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z" />
              </svg>
              {placeholder.rating} · {placeholder.reviews} opiniones
            </span>
            <span>·</span>
            <span>{business.address}, {business.city}</span>
            <span>·</span>
            <span>{placeholder.distance}</span>
          </div>

          <div className="my-5 flex items-center gap-3.5 border-y py-5">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-lg font-semibold text-primary-foreground">
              {ownerInitials}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{business.name}</div>
              <div className="text-sm text-muted-foreground">
                Anfitrión verificado · responde en ~10 min
              </div>
            </div>
          </div>

          {business.description && (
            <p className="mb-6 text-[15.5px] leading-relaxed text-muted-foreground">
              {business.description}
            </p>
          )}

          <div className="mb-7 flex flex-wrap gap-2">
            {placeholder.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-muted px-3.5 py-2 text-sm font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {amenity}
              </span>
            ))}
          </div>

          <h2 className="font-heading mb-3.5 text-xl font-semibold">Servicios</h2>
          <div className="mb-8 space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este negocio aún no tiene servicios.</p>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3.5"
                >
                  <div>
                    <div className="text-[15px] font-semibold">{service.name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {service.durationMinutes} min
                    </div>
                  </div>
                  <span className="text-[15px] font-bold">
                    {formatCents(service.priceCents, service.currency)}
                  </span>
                </div>
              ))
            )}
          </div>

          <h2 className="font-heading mb-4 text-xl font-semibold">Opiniones</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {REVIEWS.map((review) => (
              <div key={review.name} className="rounded-2xl border bg-card p-4.5 shadow-sm">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div
                    className="flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: review.color }}
                  >
                    {initials(review.name)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{review.name}</div>
                    <div className="text-xs text-muted-foreground">{review.date}</div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--primary)">
                      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z" />
                    </svg>
                    {review.rating}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* sticky booking card */}
        <aside className="sticky top-20 h-fit rounded-3xl border bg-card p-5.5 shadow-lg">
          {services[0] && (
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {formatCents(services[0].priceCents, services[0].currency)}
              </span>
              <span className="text-sm text-muted-foreground">/ {services[0].durationMinutes} min</span>
            </div>
          )}
          <div className="mb-4 text-sm text-muted-foreground">
            Selecciona día y hora para confirmar
          </div>
          <SlotPicker slots={slots} services={services} businessId={businessId} />
          <div className="mt-4 text-center text-xs text-muted-foreground">
            No se cobra nada hasta confirmar
          </div>
        </aside>
      </div>
    </div>
  );
}
