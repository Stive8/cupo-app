'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '', label: 'Dashboard' },
  { href: '/horarios', label: 'Agenda' },
  { href: '/reservas', label: 'Reservas' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/ajustes', label: 'Ajustes' },
];

export function PanelSidebarNav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/panel/${businessId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] lg:flex-col lg:overflow-visible lg:[mask-image:none]">
      {NAV_ITEMS.map((item) => {
        const href = `${base}${item.href}`;
        const active = pathname === href;
        return (
          <Link
            key={item.href}
            href={href}
            className={
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
              (active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
