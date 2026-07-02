'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCents } from '@/lib/format';
import type { AvailabilitySlot, Service } from '@/lib/types/api';

interface SlotPickerProps {
  slots: AvailabilitySlot[];
  services: Service[];
  businessId: string;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(iso: string): { dow: string; num: string } {
  const date = new Date(iso);
  return {
    dow: date.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
    num: String(date.getDate()),
  };
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

export function SlotPicker({ slots, services, businessId }: SlotPickerProps) {
  const available = [...slots]
    .filter((slot) => slot.status === 'available')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const groups = new Map<string, AvailabilitySlot[]>();
  for (const slot of available) {
    const key = dateKey(slot.startTime);
    const arr = groups.get(key) ?? [];
    arr.push(slot);
    groups.set(key, arr);
  }
  const days = Array.from(groups.keys());

  const [selectedDay, setSelectedDay] = useState<string | null>(days[0] ?? null);

  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay horarios disponibles por ahora.</p>;
  }

  const servicesById = new Map(services.map((service) => [service.id, service]));
  const dayTimes = groups.get(selectedDay ?? days[0]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {days.map((day) => {
          const { dow, num } = dayLabel(groups.get(day)![0].startTime);
          const active = day === (selectedDay ?? days[0]);
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={
                'flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted')
              }
            >
              <span className="uppercase opacity-70">{dow}</span>
              <span className="font-heading text-base">{num}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {dayTimes.map((slot) => {
          const service = servicesById.get(slot.serviceId);
          return (
            <Link
              key={slot.id}
              href={`/reservar/${slot.id}?businessId=${businessId}`}
              className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="font-medium">{timeLabel(slot.startTime)}</span>
              {service && (
                <span className="text-xs text-muted-foreground">
                  {service.name} · {formatCents(service.priceCents, service.currency)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
