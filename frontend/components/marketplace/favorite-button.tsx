'use client';

import { useState } from 'react';

// Decorative only — no favorites backend exists yet. Local visual toggle.
export function FavoriteButton({ className = '' }: { className?: string }) {
  const [active, setActive] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive((v) => !v);
      }}
      aria-label={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={
        'flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-colors ' +
        (active ? 'bg-primary' : 'bg-black/30 hover:bg-black/45') +
        ' ' +
        className
      }
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? '#fff' : 'rgba(255,255,255,.2)'}>
        <path
          d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2 5 5.4 5c2 0 3.3 1.1 4.1 2.3l.4.6.4-.6C11.3 6.1 12.6 5 14.6 5 18 5 19.6 8.6 18 11.8 15.5 16.4 12 21 12 21Z"
          stroke="#fff"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  );
}
