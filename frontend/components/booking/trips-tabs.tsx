'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCents, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import type { Booking, BookingStatus } from '@/lib/types/api';

export interface TripBusiness {
  name: string;
  city: string;
  photo: string;
  categoryLabel: string;
}

interface TripsTabsProps {
  bookings: Booking[];
  businesses: Record<string, TripBusiness>;
  cancelBookingAction: (bookingId: string, formData: FormData) => void;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const TABS = [
  { id: 'up', label: 'Próximas' },
  { id: 'past', label: 'Historial' },
  { id: 'fav', label: 'Favoritos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function TripsTabs({ bookings, businesses, cancelBookingAction }: TripsTabsProps) {
  const [tab, setTab] = useState<TabId>('up');

  const upcoming = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
  const past = bookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const list = tab === 'up' ? upcoming : tab === 'past' ? past : [];

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              '-mb-px border-b-2 px-1 py-3 mr-4 text-[14.5px] font-semibold transition-colors ' +
              (tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-14 text-center text-muted-foreground">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9.5h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mb-1 font-semibold text-foreground">Nada por aquí todavía</div>
          <div className="mb-4 text-sm">
            {tab === 'fav'
              ? 'Los negocios que guardes como favoritos aparecerán aquí.'
              : 'Cuando reserves, lo verás en esta sección.'}
          </div>
          <Button render={<Link href="/">Explorar servicios</Link>} nativeButton={false} size="sm" />
        </div>
      ) : (
        <div className="space-y-3.5">
          {list.map((booking) => {
            const business = businesses[booking.businessId];
            const isUpcoming = booking.status === 'pending' || booking.status === 'confirmed';
            return (
              <article
                key={booking.id}
                className="flex gap-4.5 rounded-2xl border bg-card p-4 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={business?.photo}
                  alt=""
                  className="h-27 w-27 shrink-0 rounded-xl bg-muted object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2.5">
                    <div>
                      <div className="text-[11.5px] font-semibold text-primary">
                        {business?.categoryLabel}
                      </div>
                      <h3 className="mt-0.5 text-[17px] font-semibold tracking-tight">
                        {business?.name}
                      </h3>
                    </div>
                    <span
                      className={
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' +
                        (isUpcoming ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground')
                      }
                    >
                      {STATUS_LABEL[booking.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                        <path
                          d="M3 9.5h18M8 3v4M16 3v4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      {formatDateTime(booking.createdAt)}
                    </span>
                    <span>Depósito: {formatCents(booking.depositCents)}</span>
                    {business && (
                      <span className="flex items-center gap-1.5">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                        {business.city}
                      </span>
                    )}
                  </div>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    {booking.status === 'pending' && (
                      <Button
                        render={<Link href={`/reservas/${booking.id}/pagar`}>Pagar</Link>}
                        nativeButton={false}
                        size="sm"
                      />
                    )}
                    {isUpcoming && (
                      <>
                        <button
                          type="button"
                          disabled
                          title="Próximamente"
                          className="cursor-not-allowed rounded-lg border px-3.5 py-2 text-[13px] font-semibold text-muted-foreground opacity-60"
                        >
                          Reprogramar
                        </button>
                        <form action={cancelBookingAction.bind(null, booking.id)}>
                          <button
                            type="submit"
                            className="rounded-lg border px-3.5 py-2 text-[13px] font-semibold text-destructive hover:bg-destructive/10"
                          >
                            Cancelar
                          </button>
                        </form>
                      </>
                    )}
                    {!isUpcoming && (
                      <>
                        <Button
                          render={<Link href={`/negocios/${booking.businessId}`}>Reservar de nuevo</Link>}
                          nativeButton={false}
                          variant="outline"
                          size="sm"
                        />
                        <button
                          type="button"
                          disabled
                          title="Próximamente"
                          className="cursor-not-allowed rounded-lg border px-3.5 py-2 text-[13px] font-semibold text-muted-foreground opacity-60"
                        >
                          Dejar opinión
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
