import Link from 'next/link';
import { apiFetch } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { placeholderListing } from '@/lib/placeholder-listing';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryPills } from '@/components/marketplace/category-pills';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import type { Business, Service } from '@/lib/types/api';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const businesses = await apiFetch<Business[]>('/businesses', { query: { city } });

  const services = await Promise.all(
    businesses.map((business) =>
      apiFetch<Service[]>(`/services/business/${business.id}`).catch(() => []),
    ),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-7">
      <div className="max-w-2xl py-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Reserva en menos de un minuto
        </div>
        <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Cualquier servicio,
          <br />
          reservado sin fricción.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
          Barberías, canchas, consultorios, estudios y más — una sola experiencia para encontrar
          disponibilidad y agendar al instante.
        </p>
      </div>

      <form className="flex max-w-md gap-2 pb-2">
        <Input name="city" placeholder="Ciudad (ej. Bogotá)" defaultValue={city} />
        <Button type="submit">Buscar</Button>
      </form>

      <CategoryPills />

      <div className="mb-4 mt-2 flex items-baseline justify-between">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Destacados cerca de ti
        </h2>
        <span className="text-sm font-semibold text-primary">Ver todo →</span>
      </div>

      {businesses.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          No encontramos negocios{city ? ` en "${city}"` : ''} todavía.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {businesses.map((business, index) => {
            const placeholder = placeholderListing(business.id, index);
            const price = services[index]?.[0];
            return (
              <Link key={business.id} href={`/negocios/${business.id}`} className="group">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={placeholder.photo}
                    alt={business.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <FavoriteButton className="absolute right-2.5 top-2.5" />
                  <div className="absolute left-2.5 top-2.5 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-neutral-900 backdrop-blur">
                    {placeholder.categoryLabel}
                  </div>
                </div>
                <div className="pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[15px] font-semibold tracking-tight">
                      {business.name}
                    </h3>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--primary)">
                        <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z" />
                      </svg>
                      {placeholder.rating}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {business.city} · {placeholder.distance}
                  </div>
                  {price && (
                    <div className="mt-1.5 text-sm">
                      <span className="font-semibold">
                        {formatCents(price.priceCents, price.currency)}
                      </span>{' '}
                      <span className="text-muted-foreground">/ {price.durationMinutes} min</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
