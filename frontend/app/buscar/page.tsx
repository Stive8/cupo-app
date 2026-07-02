import Link from 'next/link';
import { apiFetch } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { placeholderListing, placeholderMapPosition } from '@/lib/placeholder-listing';
import { SearchFilters } from '@/components/marketplace/search-filters';
import { FavoriteButton } from '@/components/marketplace/favorite-button';
import type { Business, Service } from '@/lib/types/api';

const SORTS = ['Recomendados', 'Mejor valorados', 'Precio'];

export default async function SearchResultsPage({
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-[26px] font-semibold tracking-tight">
            Explorar servicios
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {businesses.length} resultados · disponibles hoy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ordenar</span>
          {SORTS.map((label, i) => (
            <button
              key={label}
              type="button"
              disabled
              className={
                'cursor-default rounded-lg border px-3.5 py-2 text-[13px] font-semibold ' +
                (i === 0 ? 'border-primary bg-accent text-primary' : 'border-border text-muted-foreground')
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr_1fr]">
        <SearchFilters totalCount={businesses.length} />

        {/* results list */}
        <div className="flex flex-col gap-3.5">
          {businesses.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              No encontramos negocios{city ? ` en "${city}"` : ''} todavía.
            </p>
          ) : (
            businesses.map((business, index) => {
              const placeholder = placeholderListing(business.id, index);
              const price = services[index]?.[0];
              return (
                <Link
                  key={business.id}
                  href={`/negocios/${business.id}`}
                  className="flex gap-4 rounded-2xl border bg-card p-3.5 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <div className="relative h-[118px] w-[150px] shrink-0 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={placeholder.photo}
                      alt={business.name}
                      className="h-full w-full object-cover"
                    />
                    <FavoriteButton className="absolute right-2 top-2 h-7.5 w-7.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <div className="text-[11.5px] font-semibold text-primary">
                          {placeholder.categoryLabel}
                        </div>
                        <h3 className="text-[16.5px] font-semibold tracking-tight">
                          {business.name}
                        </h3>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--primary)">
                          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z" />
                        </svg>
                        {placeholder.rating}{' '}
                        <span className="font-normal text-muted-foreground">
                          ({placeholder.reviews})
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {business.city} · {placeholder.distance}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {placeholder.nextAvailable}
                      </span>
                      {price && (
                        <span className="ml-auto text-sm">
                          <span className="font-bold">
                            {formatCents(price.priceCents, price.currency)}
                          </span>{' '}
                          <span className="text-[13px] text-muted-foreground">
                            / {price.durationMinutes} min
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* map */}
        <div className="sticky top-20 hidden h-[calc(100vh-108px)] overflow-hidden rounded-2xl border bg-muted lg:block">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '46px 46px',
            }}
          />
          {businesses.map((business, index) => {
            const { x, y } = placeholderMapPosition(index);
            const price = services[index]?.[0];
            return (
              <Link
                key={business.id}
                href={`/negocios/${business.id}`}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full border bg-card px-2.5 py-1.5 text-[13px] font-bold shadow-md transition-transform hover:z-[5] hover:scale-110 hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                {price ? formatCents(price.priceCents, price.currency) : business.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
