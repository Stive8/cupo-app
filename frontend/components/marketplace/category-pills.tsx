'use client';

import { useState } from 'react';
import { CATEGORY_PILLS } from '@/lib/placeholder-listing';

// Decorative only — the MVP has a single vertical (sports_field), so these
// don't filter anything. Kept per design fidelity; toggling is purely visual.
export function CategoryPills() {
  const [active, setActive] = useState(CATEGORY_PILLS[0]);

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {CATEGORY_PILLS.map((label) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => setActive(label)}
            className={
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors ' +
              (isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted')
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
