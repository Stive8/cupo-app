'use client';

import { useState } from 'react';
import { CATEGORY_PILLS } from '@/lib/placeholder-listing';

// Decorative sidebar — MVP is a single vertical, so category/availability
// filters don't change the real result set. Price slider is visual only.
export function SearchFilters({ totalCount }: { totalCount: number }) {
  const [category, setCategory] = useState(CATEGORY_PILLS[0]);
  const [priceMax, setPriceMax] = useState(80);
  const [availability, setAvailability] = useState(0);

  const availOptions = ['Disponible hoy', 'Esta semana', 'Fin de semana'];

  return (
    <aside className="sticky top-20 h-fit rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 text-[15px] font-semibold">Filtros</div>
      <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Categoría
      </div>
      <div className="mb-5.5 flex flex-col gap-1">
        {CATEGORY_PILLS.map((label) => {
          const count = label === 'Todos' ? totalCount : label === 'Deporte' ? totalCount : 0;
          const active = category === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setCategory(label)}
              className={
                'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ' +
                (active ? 'bg-accent font-semibold text-primary' : 'font-medium text-foreground hover:bg-muted')
              }
            >
              <span>{label}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Precio máx.
      </div>
      <input
        type="range"
        min={10}
        max={120}
        value={priceMax}
        onChange={(e) => setPriceMax(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>$10</span>
        <span className="font-semibold text-primary">${priceMax}</span>
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Disponibilidad
      </div>
      <div className="flex flex-col gap-1">
        {availOptions.map((label, i) => (
          <label key={label} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[13.5px]">
            <span
              onClick={() => setAvailability(i)}
              className={
                'h-4.5 w-4.5 shrink-0 rounded-md border-[1.5px] transition-colors ' +
                (availability === i ? 'border-primary bg-primary' : 'border-border')
              }
            />
            {label}
          </label>
        ))}
      </div>
    </aside>
  );
}
